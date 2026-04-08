import axios from 'axios';
import { ClientError } from '../error/user-management.js';

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
        userIds,
        event
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch {
      // throw new ClientError('APIGatewayClient');
    }
  }

  async notifyAddressee(user2_id: number, event: WebSocketEvent): Promise<void> {
    return this.notifyUsers([user2_id], event);
  }
}
