import type { FastifyBaseLogger } from 'fastify';
import { ChannelDao } from '../dao/channel.dao.js';
import { MessageDao } from '../dao/message.dao.js';
import { NotificationService } from './notification.js';
import { BlockService } from './block.js';
import { UserClient } from '../clients/user-client.js';
import { ChatError } from '../types/chat.js';

export class MessageService {
  constructor(
    private readonly channelDao: ChannelDao,
    private readonly messageDao: MessageDao,
    private readonly notificationService: NotificationService,
    private readonly blockService: BlockService,
    private readonly logger: FastifyBaseLogger,
    private readonly userClient?: UserClient
  ) {}

  async sendMessage(channelId: string, senderId: number, content: string, senderUsername: string | null = null) {
    const channel = await this.channelDao.findById(channelId);
    if (!channel) throw new ChatError(404, 'Channel not found');

    const isMember = channel.members.some((m: { userId: number }) => m.userId === senderId);
    if (!isMember) throw new ChatError(403, 'Not a member of this channel');

    if (channel.type === 'DM') {
      const otherId = channel.members.find((m: { userId: number }) => m.userId !== senderId)?.userId;
      if (otherId !== undefined) {
        const blocked = await this.blockService.isBlocked(senderId, otherId);
        if (blocked) throw new ChatError(403, 'Cannot send message to this user');
      }
    }

    const message = await this.messageDao.create({
      channelId,
      senderId,
      senderUsername,
      content
    });

    const usernames = this.userClient ? await this.userClient.getUsernames([senderId]) : new Map<number, string>();
    senderUsername = usernames.get(senderId) ?? senderUsername;

    await Promise.all([
      this.notificationService.notifyChannelMembers(channelId, {
        type: 'chat:message',
        channelId,
        message: {
          id: message.id,
          senderId: message.senderId,
          senderUsername,
          content: message.content,
          type: message.type,
          createdAt: message.createdAt.toISOString()
        }
      }, senderId),
      this.channelDao.markRead(channelId, senderId)
    ]);

    return { ...message, senderUsername };
  }

  async getMessages(channelId: string, userId: number, cursor?: string, limit?: number) {
    const isMember = await this.channelDao.isMember(channelId, userId);
    if (!isMember) throw new ChatError(403, 'Not a member of this channel');

    const blockedIds = await this.blockService.getBlockedUserIds(userId);
    let messages = await this.messageDao.findByChannel(channelId, { cursor, limit });

    if (blockedIds.length > 0) {
      messages = messages.filter(
        (m: { type: string; senderId: number }) => m.type === 'SYSTEM' || !blockedIds.includes(m.senderId)
      );
    }

    const senderIds = Array.from(new Set(messages.map((m: { senderId: number }) => m.senderId)));
    const usernames = this.userClient ? await this.userClient.getUsernames(senderIds) : new Map<number, string>();

    return messages.map((m: { senderId: number }) => ({
      ...m,
      senderUsername: usernames.get(m.senderId) ?? null
    }));
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
