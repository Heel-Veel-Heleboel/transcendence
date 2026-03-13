import axios from 'axios';
import { ClientError } from '../error/user-management.js';

export interface WebSocketEvent {
  type: string;
  friendship_id: number;
}

export class ApiGatewayClient{
  constructor(
    private readonly baseUrl: string,
    private readonly timeout: number
  ) {}

  async notifyAddressee(user2_id: number, event: WebSocketEvent): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/internal/ws/notify `, {
        userIds: [user2_id],
        event
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch {
      throw new ClientError('APIGatewayClient');
    }
  }
}
