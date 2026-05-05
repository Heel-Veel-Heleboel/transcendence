import type { FastifyBaseLogger } from 'fastify';
import { MatchmakingClient } from '../clients/matchmaking-client.js';
import { UserClient } from '../clients/user-client.js';

export function createClients(log: FastifyBaseLogger) {
  const matchmakingClient = new MatchmakingClient(
    process.env.MATCHMAKING_URL || 'http://localhost:3005'
  );
  const userClient = new UserClient(log);
  return { matchmakingClient, userClient };
}

export type Clients = ReturnType<typeof createClients>;
