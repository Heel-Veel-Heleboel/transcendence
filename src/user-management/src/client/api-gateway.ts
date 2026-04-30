import axios from 'axios';
import pino from 'pino';
import { loggerOptions } from '../config/logger.js';

const logger = pino(loggerOptions);

export interface WebSocketEvent {
  type: string;
  [key: string]: unknown;
}

export class ApiGatewayClient{
  constructor(
    private readonly baseUrl: string,
    private readonly timeout: number
  ) {}

  async notifyUsers(userIds: number[], event: WebSocketEvent): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/internal/ws/notify`, {
        userIds: userIds.map(String),
        event
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (err) {
      logger.error({ err }, '[ApiGatewayClient] notifyUsers failed (non-fatal)');
    }
  }

  async notifyAddressee(user2_id: number, event: WebSocketEvent): Promise<void> {
    return this.notifyUsers([user2_id], event);
  }

  async broadcastToAllUsers(event: WebSocketEvent): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/internal/ws/broadcast`, {
        event
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (err) {
      logger.error({ err }, '[ApiGatewayClient] broadcastToAllUsers failed (non-fatal)');
    }
  }
}
