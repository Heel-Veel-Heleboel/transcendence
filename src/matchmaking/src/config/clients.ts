import type { FastifyBaseLogger } from 'fastify';
import { GameServerClient } from '../clients/game-server-client.js';
import { ChatServiceClient } from '../clients/chat-service-client.js';
import { GatewayNotificationClient } from '../clients/gateway-notification-client.js';

export function createClients(log: FastifyBaseLogger) {
  const gameServerClient = new GameServerClient(
    process.env.GAME_SERVER_URL || 'http://localhost:2567',
    log
  );

  const chatServiceClient = new ChatServiceClient(
    process.env.CHAT_SERVICE_URL || 'http://localhost:3006',
    log
  );

  const gatewayNotificationClient = new GatewayNotificationClient(
    process.env.GATEWAY_URL || 'http://localhost:3000',
    log
  );

  const userManagementClient = {
    async reportMatchResult(message: { playerId: number; isWinner: boolean }): Promise<void> {
      const url = process.env.USER_MANAGEMENT_URL || 'http://localhost:3004';
      try {
        const response = await fetch(`${url}/users/profile/update-stats`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: message.playerId, is_winner: message.isWinner })
        });
        if (!response.ok) {
          log.warn({ playerId: message.playerId, status: response.status }, 'Failed to report match result');
        }
      } catch (error) {
        log.error({ error, playerId: message.playerId }, 'Error reporting match result');
      }
    }
  };

  return { gameServerClient, chatServiceClient, gatewayNotificationClient, userManagementClient };
}

export type Clients = ReturnType<typeof createClients>;
