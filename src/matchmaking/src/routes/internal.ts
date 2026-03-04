import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MatchDao } from '../dao/match.js';
import { ChatServiceClient } from '../services/chat-service-client.js';
import { MatchmakingService } from '../services/casual-matchmaking.js';
import { PoolRegistry } from '../services/pool-registry.js';
import { isValidGameMode, GameMode } from '../types/match.js';

/**
 * Register internal routes (service-to-service only, not exposed to end users)
 */
export async function registerInternalRoutes(
  server: FastifyInstance,
  matchDao: MatchDao,
  chatServiceClient: ChatServiceClient,
  pools: Record<GameMode, MatchmakingService>,
  poolRegistry: PoolRegistry
): Promise<void> {

  /**
   * POST /matchmaking/internal/direct-match
   * Create a match between two specific players who agreed via a game invite,
   * bypassing the matchmaking queue. The ack flow is the same as for casual
   * matches: a match-ack notification is sent to both players and each player
   * must acknowledge before the game room is provisioned.
   *
   * If either player is currently in a matchmaking pool, they are removed from
   * it — the direct invite takes precedence.
   *
   * Called by the chat service after a game invite is accepted.
   *
   * Body: { playerIds: [number, number], gameMode: string }
   */
  server.post('/matchmaking/internal/direct-match', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as { playerIds?: unknown; gameMode?: unknown };
    const { playerIds, gameMode } = body;

    if (
      !Array.isArray(playerIds) ||
      playerIds.length !== 2 ||
      typeof playerIds[0] !== 'number' ||
      typeof playerIds[1] !== 'number'
    ) {
      return reply.status(400).send({ error: 'playerIds must be an array of exactly two numbers' });
    }

    if (typeof gameMode !== 'string' || !isValidGameMode(gameMode)) {
      return reply.status(400).send({ error: 'gameMode must be one of: classic, powerup' });
    }

    const [player1Id, player2Id] = playerIds as [number, number];

    if (player1Id === player2Id) {
      return reply.status(400).send({ error: 'playerIds must be two different players' });
    }

    try {
      // Remove both players from their respective pool if they are currently queued.
      // A direct game invite takes precedence over the casual matchmaking queue.
      for (const playerId of [player1Id, player2Id]) {
        const currentPool = poolRegistry.getCurrentPool(playerId);
        if (currentPool && isValidGameMode(currentPool)) {
          pools[currentPool].leavePool(playerId);
          poolRegistry.unregisterUser(playerId);
          request.log.info({ playerId, pool: currentPool }, 'Removed player from pool for direct match');
        }
      }

      const ACK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes, same as casual matchmaking
      const deadline = new Date(Date.now() + ACK_TIMEOUT_MS);

      // Create the match record — same as casual matchmaking, status starts as PENDING_ACKNOWLEDGEMENT.
      // Usernames are placeholders; match history will resolve real names via user-management.
      const match = await matchDao.create({
        player1Id,
        player2Id,
        player1Username: `user_${player1Id}`,
        player2Username: `user_${player2Id}`,
        gameMode,
        deadline,
      });

      // Send match-ack notification via the chat service — identical to the casual flow.
      // Both players receive an ack prompt and must respond before the room is provisioned.
      chatServiceClient.sendMatchAck(
        match.id,
        [player1Id, player2Id],
        gameMode,
        deadline
      ).catch(err => {
        request.log.error({ err, matchId: match.id }, 'Failed to send match-ack for direct match');
      });

      request.log.info({ matchId: match.id, player1Id, player2Id, gameMode }, 'Direct match created via game invite');

      return reply.status(201).send({ matchId: match.id });
    } catch (error) {
      request.log.error({ error, player1Id, player2Id, gameMode }, 'Failed to create direct match');
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to create direct match' });
    }
  });
}
