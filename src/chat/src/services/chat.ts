import { ChannelDao } from '../dao/channel.dao.js';
import { MessageDao } from '../dao/message.dao.js';
import { NotificationService } from './notification.js';
import { BlockService } from './block.js';
import type { MatchAckMetadata } from '../types/chat.js';

export class ChatService {
  constructor(
    private readonly channelDao: ChannelDao,
    private readonly messageDao: MessageDao,
    private readonly notificationService: NotificationService,
    private readonly blockService: BlockService,
    private readonly logger?: { info: Function; error: Function; warn: Function }
  ) {}

  // ── Channels ──────────────────────────────────────────────

  async createDMChannel(userId: number, targetUserId: number) {
    if (userId === targetUserId) {
      throw new ChatError(400, 'Cannot create DM with yourself');
    }

    const blocked = await this.blockService.isBlocked(userId, targetUserId);
    if (blocked) {
      throw new ChatError(403, 'Cannot create DM with this user');
    }

    const existing = await this.channelDao.findDMBetweenUsers(userId, targetUserId);
    if (existing) return existing;

    const channel = await this.channelDao.create({
      type: 'DM',
      createdBy: userId,
      memberIds: [userId, targetUserId]
    });

    await this.notificationService.notifyUsers([targetUserId], {
      type: 'chat:channel_created',
      channel: {
        id: channel.id,
        type: channel.type,
        name: channel.name,
        members: channel.members.map((m: { userId: number }) => m.userId)
      }
    });

    return channel;
  }

  async createGroupChannel(userId: number, name: string, memberIds: number[]) {
    const allMembers = Array.from(new Set([userId, ...memberIds]));

    const channel = await this.channelDao.create({
      type: 'GROUP',
      name,
      createdBy: userId,
      memberIds: allMembers
    });

    const otherMembers = allMembers.filter(id => id !== userId);
    if (otherMembers.length > 0) {
      await this.notificationService.notifyUsers(otherMembers, {
        type: 'chat:channel_created',
        channel: {
          id: channel.id,
          type: channel.type,
          name: channel.name,
          members: allMembers
        }
      });
    }

    return channel;
  }

  async getUserChannels(userId: number) {
    return this.channelDao.findByUserId(userId);
  }

  async getChannel(channelId: string, userId: number) {
    const channel = await this.channelDao.findById(channelId);
    if (!channel) throw new ChatError(404, 'Channel not found');

    const isMember = channel.members.some((m: { userId: number }) => m.userId === userId);
    if (!isMember) throw new ChatError(403, 'Not a member of this channel');

    return channel;
  }

  async addMember(channelId: string, requesterId: number, userId: number) {
    const channel = await this.channelDao.findById(channelId);
    if (!channel) throw new ChatError(404, 'Channel not found');
    if (channel.type === 'DM') throw new ChatError(400, 'Cannot add members to a DM');

    const isRequesterMember = channel.members.some((m: { userId: number }) => m.userId === requesterId);
    if (!isRequesterMember) throw new ChatError(403, 'Not a member of this channel');

    const isAlreadyMember = channel.members.some((m: { userId: number }) => m.userId === userId);
    if (isAlreadyMember) throw new ChatError(409, 'User is already a member');

    await this.channelDao.addMember(channelId, userId);

    await this.notificationService.notifyUsers([userId], {
      type: 'chat:channel_created',
      channel: {
        id: channel.id,
        type: channel.type,
        name: channel.name,
        members: [...channel.members.map((m: { userId: number }) => m.userId), userId]
      }
    });

    await this.sendSystemMessage(channelId, `User ${userId} joined the channel`);
  }

  async removeMember(channelId: string, requesterId: number, userId: number) {
    const channel = await this.channelDao.findById(channelId);
    if (!channel) throw new ChatError(404, 'Channel not found');
    if (channel.type === 'DM') throw new ChatError(400, 'Cannot leave a DM');

    if (requesterId !== userId && channel.createdBy !== requesterId) {
      throw new ChatError(403, 'Only the channel creator can remove members');
    }

    await this.channelDao.removeMember(channelId, userId);
    await this.sendSystemMessage(channelId, `User ${userId} left the channel`);
  }

  // ── Messages ──────────────────────────────────────────────

  async sendMessage(channelId: string, senderId: number, content: string) {
    const isMember = await this.channelDao.isMember(channelId, senderId);
    if (!isMember) throw new ChatError(403, 'Not a member of this channel');

    const message = await this.messageDao.create({
      channelId,
      senderId,
      content
    });

    await this.notificationService.notifyChannelMembers(channelId, {
      type: 'chat:message',
      channelId,
      message: {
        id: message.id,
        senderId: message.senderId,
        content: message.content,
        type: message.type,
        createdAt: message.createdAt.toISOString()
      }
    }, senderId);

    return message;
  }

  async getMessages(channelId: string, userId: number, cursor?: string, limit?: number) {
    const isMember = await this.channelDao.isMember(channelId, userId);
    if (!isMember) throw new ChatError(403, 'Not a member of this channel');

    const blockedIds = await this.blockService.getBlockedUserIds(userId);
    const messages = await this.messageDao.findByChannel(channelId, { cursor, limit });

    if (blockedIds.length > 0) {
      return messages.filter(
        (m: { type: string; senderId: number }) => m.type === 'SYSTEM' || !blockedIds.includes(m.senderId)
      );
    }

    return messages;
  }

  // ── Match Acknowledgement ─────────────────────────────────
  // Called by matchmaking service when a pair is matched.
  // Creates a game session channel and posts an ack-required
  // system message that expires. Players respond via respondToMatchAck.

  async sendMatchAck(
    matchId: string,
    playerIds: number[],
    gameMode: string,
    expiresAt: string
  ) {
    const uniqueIds = Array.from(new Set(playerIds));
    if (uniqueIds.length !== 2) {
      throw new ChatError(400, 'sendMatchAck requires exactly 2 unique player IDs');
    }

    // Create the game session channel for the matched pair
    const channel = await this.channelDao.create({
      type: 'GAME_SESSION',
      name: `Match ${matchId}`,
      memberIds: uniqueIds
    });

    // Post a MATCH_ACK message for each player
    const messages = [];
    for (const playerId of uniqueIds) {
      const opponentId = uniqueIds.find(id => id !== playerId) as number;
      const metadata: MatchAckMetadata = {
        matchId,
        gameMode,
        opponentId,
        expiresAt,
        status: 'pending'
      };

      const message = await this.messageDao.create({
        channelId: channel.id,
        senderId: 0,
        content: `Match found! Game mode: ${gameMode}. Please acknowledge to start.`,
        type: 'SYSTEM',
        metadata: JSON.stringify(metadata)
      });
      messages.push(message);
    }

    // Notify both players
    await this.notificationService.notifyUsers(uniqueIds, {
      type: 'chat:match_ack_required',
      channelId: channel.id,
      matchId,
      gameMode,
      expiresAt
    });

    return { channel, messages };
  }

  async respondToMatchAck(messageId: string, playerId: number, acknowledge: boolean) {
    const message = await this.messageDao.findById(messageId);
    if (!message) throw new ChatError(404, 'Match acknowledgement not found');
    if (!message.metadata) throw new ChatError(400, 'Not a match acknowledgement message');

    const metadata: MatchAckMetadata = JSON.parse(message.metadata);
    if (!metadata.matchId) throw new ChatError(400, 'Not a match acknowledgement message');

    // The ack message is addressed to the opponent of the sender — verify the caller is authorized
    if (metadata.opponentId === playerId) {
      throw new ChatError(403, 'This acknowledgement is not addressed to you');
    }

    // Verify caller is a member of the channel
    const isMember = await this.channelDao.isMember(message.channelId, playerId);
    if (!isMember) throw new ChatError(403, 'Not a member of this channel');

    if (metadata.status !== 'pending') {
      throw new ChatError(400, `Acknowledgement already ${metadata.status}`);
    }

    if (new Date(metadata.expiresAt) < new Date()) {
      metadata.status = 'expired';
      await this.messageDao.updateMetadata(messageId, JSON.stringify(metadata));
      throw new ChatError(410, 'Match acknowledgement has expired');
    }

    metadata.status = acknowledge ? 'acknowledged' : 'expired';
    await this.messageDao.updateMetadata(messageId, JSON.stringify(metadata));

    // Notify the opponent about the ack response
    await this.notificationService.notifyUsers([metadata.opponentId], {
      type: 'chat:match_ack_response',
      matchId: metadata.matchId,
      playerId,
      acknowledged: acknowledge
    });

    return { acknowledged: acknowledge, matchId: metadata.matchId, gameMode: metadata.gameMode };
  }

  // ── Internal / System ─────────────────────────────────────

  async createGameSessionChannel(playerIds: number[], gameSessionId: string) {
    return this.channelDao.create({
      type: 'GAME_SESSION',
      name: `Game ${gameSessionId}`,
      memberIds: playerIds
    });
  }

  async createTournamentChannel(userId: number, tournamentId: number, tournamentName: string) {
    const channelName = `Tournament #${tournamentId}: ${tournamentName}`;

    const channels = await this.channelDao.findByUserId(userId);
    const existing = channels.find(
      (c: { type: string; name: string | null }) => c.type === 'TOURNAMENT' && c.name === channelName
    );
    if (existing) {
      this.logger?.info({ userId, tournamentId }, 'Tournament channel already exists');
      return existing;
    }

    this.logger?.info({ userId, tournamentId, tournamentName }, 'Creating tournament channel');

    const channel = await this.channelDao.create({
      type: 'TOURNAMENT',
      name: channelName,
      memberIds: [userId]
    });

    await this.sendSystemMessage(
      channel.id,
      `You have been subscribed to tournament: ${tournamentName}`
    );

    return channel;
  }

  async sendSystemMessage(channelId: string, content: string) {
    const message = await this.messageDao.create({
      channelId,
      senderId: 0,
      content,
      type: 'SYSTEM'
    });

    await this.notificationService.notifyChannelMembers(channelId, {
      type: 'chat:message',
      channelId,
      message: {
        id: message.id,
        senderId: 0,
        content: message.content,
        type: message.type,
        createdAt: message.createdAt.toISOString()
      }
    });

    return message;
  }
}

export class ChatError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'ChatError';
  }
}
