import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MatchDao } from '../dao/match.js';
import { ChatServiceClient } from '../services/chat-service-client.js';
import { MatchmakingService } from '../services/casual-matchmaking.js';
import { PoolRegistry } from '../services/pool-registry.js';
import { isValidGameMode, GameMode } from '../types/match.js';
import { getUserIdFromHeader, getUserNameFromHeader } from './request-context.js';
import { DEFAULT_ACK_TIMEOUT_MS } from '../types/match.js';

/**
 * Register direct-challenge route.
 * Called by the frontend when a player challenges a specific opponent to a game.
 * Bypasses the matchmaking queue — the match-ack flow handles readiness confirmation.
 */
export async function registerDirectChallengeRoutes(
  server: FastifyInstance,
  matchDao: MatchDao,
  chatServiceClient: ChatServiceClient,
  pools: Record<GameMode, MatchmakingService>,
  poolRegistry: PoolRegistry
): Promise<void> {

  /**
   * POST /matchmaking/direct-challenge
   * Challenge a specific player to a direct game.
   * Creates a match and sends a match-ack to both players — the normal ack flow
   * then handles readiness before the game room is provisioned.
   *
   * If either player is currently in the matchmaking queue they are removed from
   * it — the direct challenge takes precedence.
   *
   * Headers: x-user-id (challenger), x-user-name (challenger username)
   * Body: { inviteeId: number, inviteeUsername: string, gameMode: string }
   */
  server.post('/matchmaking/direct-challenge', async (request: FastifyRequest, reply: FastifyReply) => {
    const challengerId = getUserIdFromHeader(request);
    const challengerUsername = getUserNameFromHeader(request);

    if (challengerId === null) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Missing x-user-id header' });
    }
    if (challengerUsername === null) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Missing x-user-name header' });
    }

    const body = request.body as { inviteeId?: unknown; inviteeUsername?: unknown; gameMode?: unknown };
    const { inviteeId, inviteeUsername, gameMode } = body;

    if (typeof inviteeId !== 'number') {
      return reply.status(400).send({ error: 'inviteeId must be a number' });
    }
    if (typeof inviteeUsername !== 'string' || inviteeUsername.trim() === '') {
      return reply.status(400).send({ error: 'inviteeUsername must be a non-empty string' });
    }
    if (typeof gameMode !== 'string' || !isValidGameMode(gameMode)) {
      return reply.status(400).send({ error: 'gameMode must be one of: classic, powerup' });
    }
    if (challengerId === inviteeId) {
      return reply.status(400).send({ error: 'Cannot challenge yourself' });
    }

    try {
      // Remove both players from their pool if they are currently queued.
      for (const playerId of [challengerId, inviteeId]) {
        const currentPool = poolRegistry.getCurrentPool(playerId);
        if (currentPool && isValidGameMode(currentPool)) {
          pools[currentPool].leavePool(playerId);
          poolRegistry.unregisterUser(playerId);
          request.log.info({ playerId, pool: currentPool }, 'Removed player from pool for direct challenge');
        }
      }

      const deadline = new Date(Date.now() + DEFAULT_ACK_TIMEOUT_MS);

      const match = await matchDao.create({
        player1Id: challengerId,
        player2Id: inviteeId,
        player1Username: challengerUsername,
        player2Username: inviteeUsername.trim(),
        gameMode,
        deadline
      });

      chatServiceClient.sendMatchAck(
        match.id,
        [challengerId, inviteeId],
        gameMode,
        deadline
      ).catch(err => {
        request.log.error({ err, matchId: match.id }, 'Failed to send match-ack for direct challenge');
      });

      request.log.info(
        { matchId: match.id, challengerId, inviteeId, gameMode },
        'Direct challenge match created'
      );

      return reply.status(201).send({ matchId: match.id });
    } catch (error) {
      request.log.error({ error, challengerId, inviteeId, gameMode }, 'Failed to create direct challenge');
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to create direct challenge' });
    }
  });
}
