import type { FastifyBaseLogger } from 'fastify';
import { ChannelDao } from '../dao/channel.dao.js';
import { MessageDao } from '../dao/message.dao.js';
import { NotificationService } from './notification.js';
import { BlockService } from './block.js';
import { UserClient } from '../clients/user-client.js';
import { ChatError } from '../types/chat.js';

export class ChannelService {
  constructor(
    private readonly channelDao: ChannelDao,
    private readonly messageDao: MessageDao,
    private readonly notificationService: NotificationService,
    private readonly blockService: BlockService,
    private readonly logger: FastifyBaseLogger,
    private readonly userClient?: UserClient
  ) {}

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
    const channels = await this.channelDao.findByUserId(userId);

    const batchInput = channels.map((channel: { id: string; members: { userId: number; lastReadAt: Date | null }[] }) => {
      const membership = channel.members.find((m) => m.userId === userId);
      return { id: channel.id, lastReadAt: membership?.lastReadAt ?? null };
    });

    const unreadCounts = await this.messageDao.countUnreadBatch(batchInput);

    const allMemberIds = Array.from(new Set(
      channels.flatMap((c: { members: { userId: number }[] }) => c.members.map((m) => m.userId))
    ));
    const usernames = this.userClient ? await this.userClient.getUsernames(allMemberIds) : new Map<number, string>();

    return channels.map((channel: { id: string; members: { userId: number }[] }) => ({
      ...channel,
      members: channel.members.map((m) => ({
        ...m,
        username: usernames.get(m.userId) ?? null
      })),
      unreadCount: unreadCounts.get(channel.id) ?? 0
    }));
  }

  async markChannelRead(channelId: string, userId: number) {
    const isMember = await this.channelDao.isMember(channelId, userId);
    if (!isMember) throw new ChatError(403, 'Not a member of this channel');

    await this.channelDao.markRead(channelId, userId);
  }

  async getChannel(channelId: string, userId: number) {
    const channel = await this.channelDao.findById(channelId);
    if (!channel) throw new ChatError(404, 'Channel not found');

    const isMember = channel.members.some((m: { userId: number }) => m.userId === userId);
    if (!isMember) throw new ChatError(403, 'Not a member of this channel');

    const memberIds = channel.members.map((m: { userId: number }) => m.userId);
    const usernames = this.userClient ? await this.userClient.getUsernames(memberIds) : new Map<number, string>();

    return {
      ...channel,
      members: channel.members.map((m: { userId: number }) => ({
        ...m,
        username: usernames.get(m.userId) ?? null
      }))
    };
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

  async deleteChannel(channelId: string, userId: number) {
    const channel = await this.channelDao.findById(channelId);
    if (!channel) throw new ChatError(404, 'Channel not found');

    const isMember = channel.members.some((m: { userId: number }) => m.userId === userId);
    if (!isMember) throw new ChatError(403, 'Not a member of this channel');

    if (channel.type === 'TOURNAMENT') {
      throw new ChatError(403, 'Tournament channels cannot be deleted');
    }

    if (channel.type === 'GROUP' && channel.createdBy !== userId) {
      throw new ChatError(403, 'Only the channel creator can delete this channel');
    }

    await this.channelDao.delete(channelId);

    const otherMembers = channel.members
      .map((m: { userId: number }) => m.userId)
      .filter((id: number) => id !== userId);

    if (otherMembers.length > 0) {
      await this.notificationService.notifyUsers(otherMembers, {
        type: 'chat:channel_deleted',
        channelId
      });
    }
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

  async createTournamentChannel(userId: number, tournamentId: number, tournamentName: string) {
    const channelName = `Tournament #${tournamentId}: ${tournamentName}`;

    const channels = await this.channelDao.findByUserId(userId);
    const existing = channels.find(
      (c: { type: string; name: string | null }) => c.type === 'TOURNAMENT' && c.name === channelName
    );
    if (existing) {
      this.logger.info({ userId, tournamentId }, 'Tournament channel already exists');
      return existing;
    }

    this.logger.info({ userId, tournamentId, tournamentName }, 'Creating tournament channel');

    const channel = await this.channelDao.create({
      type: 'TOURNAMENT',
      name: channelName,
      memberIds: [userId]
    });

    await this.sendSystemMessage(channel.id, `You have been subscribed to tournament: ${tournamentName}`);

    return channel;
  }

  private async sendSystemMessage(channelId: string, content: string) {
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
