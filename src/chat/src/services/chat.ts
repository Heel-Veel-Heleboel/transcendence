import { ChannelDao } from '../dao/channel.dao.js';
import { MessageDao } from '../dao/message.dao.js';
import { NotificationService } from './notification.js';
import { BlockService } from './block.js';
import { MatchmakingClient } from './matchmaking-client.js';
import type { MatchAckMetadata } from '../types/chat.js';

export class ChatService {
  constructor(
    private readonly channelDao: ChannelDao,
    private readonly messageDao: MessageDao,
    private readonly notificationService: NotificationService,
    private readonly blockService: BlockService,
    private readonly logger?: { info: Function; error: Function; warn: Function },
    private readonly matchmakingClient?: MatchmakingClient
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
    const [playerA, playerB] = uniqueIds as [number, number];

    // Find or create DM between the two matched players.
    // Block checks are intentionally skipped here — matchmaking should
    // prevent blocked users from being paired, but we don't gate on it at
    // the chat layer for system-initiated acks.
    let channel = await this.channelDao.findDMBetweenUsers(playerA, playerB);
    if (!channel) {
      channel = await this.channelDao.create({
        type: 'DM',
        memberIds: [playerA, playerB]
      });
      await this.notificationService.notifyUsers([playerA, playerB], {
        type: 'chat:channel_created',
        channel: {
          id: channel.id,
          type: channel.type,
          name: channel.name,
          members: [playerA, playerB]
        }
      });
    }

    // One shared ack message — both players respond to the same message.
    const metadata: MatchAckMetadata = {
      matchId,
      gameMode,
      playerIds: [playerA, playerB],
      acknowledgedBy: [],
      expiresAt,
      status: 'pending'
    };

    const message = await this.messageDao.create({
      channelId: channel.id,
      senderId: 0,
      content: `Match found! Game mode: ${gameMode}. Both players must acknowledge to start.`,
      type: 'SYSTEM',
      metadata: JSON.stringify(metadata)
    });

    await this.notificationService.notifyUsers([playerA, playerB], {
      type: 'chat:match_ack_required',
      channelId: channel.id,
      matchId,
      gameMode,
      expiresAt
    });

    return { channel, message };
  }

  async respondToMatchAck(messageId: string, playerId: number, acknowledge: boolean) {
    const message = await this.messageDao.findById(messageId);
    if (!message) throw new ChatError(404, 'Match acknowledgement not found');
    if (!message.metadata) throw new ChatError(400, 'Not a match acknowledgement message');

    const metadata: MatchAckMetadata = JSON.parse(message.metadata);
    if (!metadata.matchId) throw new ChatError(400, 'Not a match acknowledgement message');

    if (!metadata.playerIds.includes(playerId)) {
      throw new ChatError(403, 'You are not part of this match');
    }

    if (metadata.status !== 'pending') {
      throw new ChatError(400, `Match already ${metadata.status}`);
    }

    if (new Date(metadata.expiresAt) < new Date()) {
      metadata.status = 'expired';
      await this.messageDao.updateMetadata(messageId, JSON.stringify(metadata));
      throw new ChatError(410, 'Match acknowledgement has expired');
    }

    if (metadata.acknowledgedBy.includes(playerId)) {
      throw new ChatError(409, 'You have already responded to this match');
    }

    if (!acknowledge) {
      metadata.status = 'declined';
      await this.messageDao.updateMetadata(messageId, JSON.stringify(metadata));

      // Forward decline to matchmaking (cancels the match)
      if (this.matchmakingClient) {
        try {
          await this.matchmakingClient.decline(metadata.matchId, playerId);
        } catch (err) {
          this.logger?.error({ err, matchId: metadata.matchId, playerId }, 'Failed to forward decline to matchmaking');
        }
      }

      await this.notificationService.notifyUsers(metadata.playerIds, {
        type: 'chat:match_ack_response',
        matchId: metadata.matchId,
        playerId,
        acknowledged: false
      });
      return { acknowledged: false, matchId: metadata.matchId, gameMode: metadata.gameMode };
    }

    metadata.acknowledgedBy.push(playerId);
    const bothAcked = metadata.acknowledgedBy.length === metadata.playerIds.length;
    if (bothAcked) metadata.status = 'acknowledged';

    await this.messageDao.updateMetadata(messageId, JSON.stringify(metadata));

    // Forward acknowledgement to matchmaking (triggers room creation when both acked)
    if (this.matchmakingClient) {
      try {
        await this.matchmakingClient.acknowledge(metadata.matchId, playerId);
      } catch (err) {
        this.logger?.error({ err, matchId: metadata.matchId, playerId }, 'Failed to forward ack to matchmaking');
      }
    }

    await this.notificationService.notifyUsers(metadata.playerIds, {
      type: 'chat:match_ack_response',
      matchId: metadata.matchId,
      playerId,
      acknowledged: true,
      bothAcked
    });

    return { acknowledged: true, matchId: metadata.matchId, gameMode: metadata.gameMode, bothAcked };
  }

  // ── Internal / System ─────────────────────────────────────

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
