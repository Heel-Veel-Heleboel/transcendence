import type { FastifyBaseLogger } from 'fastify';
import { ChannelDao } from '../dao/channel.dao.js';
import { MessageDao } from '../dao/message.dao.js';
import { NotificationService } from './notification.js';
import { MatchmakingClient } from '../clients/matchmaking-client.js';
import { ChatError, type MatchAckMetadata } from '../types/chat.js';

export class MatchAckService {
  constructor(
    private readonly channelDao: ChannelDao,
    private readonly messageDao: MessageDao,
    private readonly notificationService: NotificationService,
    private readonly logger: FastifyBaseLogger,
    private readonly matchmakingClient?: MatchmakingClient
  ) {}

  async sendMatchAck(
    matchId: string,
    playerIds: number[],
    gameMode: string,
    expiresAt: string,
    tournamentId?: number,
    tournamentName?: string,
    challengerUsername?: string
  ) {
    const uniqueIds = Array.from(new Set(playerIds));
    if (uniqueIds.length !== 2) {
      throw new ChatError(400, 'sendMatchAck requires exactly 2 unique player IDs');
    }
    const [playerA, playerB] = uniqueIds as [number, number];

    // Block checks are intentionally skipped — matchmaking prevents blocked users from being paired.
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

    const metadata: MatchAckMetadata = {
      matchId,
      gameMode,
      playerIds: [playerA, playerB],
      acknowledgedBy: [],
      expiresAt,
      status: 'pending',
      ...(tournamentId != null && { tournamentId }),
      ...(tournamentName != null && { tournamentName })
    };

    const minutesToConfirm = Math.round((new Date(expiresAt).getTime() - Date.now()) / 60_000);
    const timeToConfirm = `Time to confirm: ${minutesToConfirm} min.`;

    let content: string;
    if (tournamentName) {
      content = `Upcoming game in ${tournamentName}. Both players must acknowledge to start. ${timeToConfirm}`;
    } else if (challengerUsername) {
      content = `Friendly challenge from ${challengerUsername}! Game mode: ${gameMode}. Both players must acknowledge to start. ${timeToConfirm}`;
    } else {
      content = `Match found! Game mode: ${gameMode}. Both players must acknowledge to start. ${timeToConfirm}`;
    }

    const message = await this.messageDao.create({
      channelId: channel.id,
      senderId: 0,
      content,
      type: 'SYSTEM',
      metadata: JSON.stringify(metadata)
    });

    await this.notificationService.notifyUsers([playerA, playerB], {
      type: 'chat:match_ack_required',
      channelId: channel.id,
      messageId: message.id,
      matchId,
      gameMode,
      expiresAt,
      ...(tournamentId != null && { tournamentId }),
      ...(tournamentName != null && { tournamentName })
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
      if (this.matchmakingClient) {
        try {
          await this.matchmakingClient.decline(metadata.matchId, playerId);
        } catch (err) {
          this.logger.error({ err, matchId: metadata.matchId, playerId }, 'Failed to forward decline to matchmaking');
          throw err;
        }
      }

      metadata.status = 'declined';
      await this.messageDao.updateMetadata(messageId, JSON.stringify(metadata));

      await this.notificationService.notifyUsers(metadata.playerIds, {
        type: 'chat:match_ack_response',
        matchId: metadata.matchId,
        playerId,
        acknowledged: false,
        matchCancelled: true
      });
      return { acknowledged: false, matchId: metadata.matchId, gameMode: metadata.gameMode };
    }

    metadata.acknowledgedBy.push(playerId);
    const bothAcked = metadata.acknowledgedBy.length === metadata.playerIds.length;
    if (bothAcked) metadata.status = 'acknowledged';

    await this.messageDao.updateMetadata(messageId, JSON.stringify(metadata));

    if (this.matchmakingClient) {
      try {
        await this.matchmakingClient.acknowledge(metadata.matchId, playerId);
      } catch (err) {
        this.logger.error({ err, matchId: metadata.matchId, playerId }, 'Failed to forward ack to matchmaking');
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
}
