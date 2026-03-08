import axios from 'axios';


export interface WebSocketEvent {
  type: string;
  friendship_id: number;
}

export class ApiGatewayClient{
  constructor(
    private readonly baseUrl: string,
    private readonly timeout: number
  ) {}

  async notifyAddressee(addressee_id: number, event: WebSocketEvent): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/notifications/friendship-request`, {
        userIds: [addressee_id],
        event
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Error notifying addressee:', error);
    }
  }
}
