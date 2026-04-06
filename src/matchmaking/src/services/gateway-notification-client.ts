import { Logger } from '../types/logger.js';

/**
 * GatewayNotificationClient
 *
 * Pushes WebSocket events to connected clients via the API gateway's
 * internal notification endpoint (POST /internal/ws/notify).
 */
export class GatewayNotificationClient {
  constructor(
    private readonly gatewayUrl: string,
    private readonly logger?: Logger
  ) {}

  async notifyUsers(userIds: number[], event: { type: string; [key: string]: unknown }): Promise<void> {
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
        this.log('warn', `Gateway notify returned ${response.status} for event ${event.type}`);
      }
    } catch (error) {
      this.log('error', `Failed to notify via gateway for event ${event.type}`, { error });
    }
  }

  async broadcastEvent(event: { type: string; [key: string]: unknown }): Promise<void> {
    try {
      const response = await fetch(`${this.gatewayUrl}/internal/ws/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event })
      });

      if (!response.ok) {
        this.log('warn', `Gateway broadcast returned ${response.status} for event ${event.type}`);
      }
    } catch (error) {
      this.log('error', `Failed to broadcast via gateway for event ${event.type}`, { error });
    }
  }

  private log(level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>): void {
    if (this.logger) {
      this.logger[level]({ ...meta, service: 'gateway-notification-client' }, message);
    } else {
      console.log(`[${level.toUpperCase()}] ${message}`, meta || '');
    }
  }
}
