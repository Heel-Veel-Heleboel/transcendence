import { ChannelDao } from '../dao/channel.dao.js';
import type { WebSocketEvent } from '../types/chat.js';

export class NotificationService {
  private readonly gatewayUrl: string;

  constructor(
    private readonly channelDao: ChannelDao,
    private readonly logger?: { info: Function; error: Function; warn: Function }
  ) {
    this.gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:3002';
  }

  async notifyUsers(userIds: number[], event: WebSocketEvent): Promise<void> {
    try {
      const response = await fetch(`${this.gatewayUrl}/internal/ws/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: userIds.map(String),
          event
        })
      });

      if (!response.ok) {
        this.logger?.warn({ status: response.status, event: event.type }, 'Gateway notify returned non-OK');
      }
    } catch (error) {
      this.logger?.error({ error, event: event.type }, 'Failed to notify via gateway');
    }
  }

  async notifyChannelMembers(
    channelId: string,
    event: WebSocketEvent,
    excludeUserId?: number
  ): Promise<void> {
    const memberIds = await this.channelDao.getMemberIds(channelId);
    const targetIds = excludeUserId
      ? memberIds.filter(id => id !== excludeUserId)
      : memberIds;

    if (targetIds.length === 0) return;

    await this.notifyUsers(targetIds, event);
  }
}
