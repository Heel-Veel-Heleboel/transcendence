import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MatchmakingService } from '../services/casual-matchmaking.js';
import { PoolRegistry } from '../services/pool-registry.js';
import { ChatServiceClient } from '../services/chat-service-client.js';
import { isValidGameMode, GameMode } from '../types/match.js';
import { getUserIdFromHeader, getUserNameFromHeader } from './request-context.js';

/**
 * Pool lookup map - maps gameMode to MatchmakingService instance
 */
type PoolMap = Record<GameMode, MatchmakingService>;

/**
 * Register matchmaking routes
 *
 * Routes use :gameMode param to support multiple pools (classic, powerup)
 * PoolRegistry ensures users can only be in one pool at a time
 *
 */
export async function registerMatchmakingRoutes(
  server: FastifyInstance,
  pools: PoolMap,
  poolRegistry: PoolRegistry,
  chatServiceClient: ChatServiceClient
): Promise<void> {

  /**
   * POST /matchmaking/:gameMode/join
   * Add current user to the matchmaking pool for specified game mode
   */
  server.post('/matchmaking/:gameMode/join', async (request: FastifyRequest, reply: FastifyReply) => {
    const { gameMode } = request.params as { gameMode: string };

    if (!isValidGameMode(gameMode)) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid gameMode. Must be one of: classic, powerup'
      });
    }

    const userId = getUserIdFromHeader(request);
    const username = getUserNameFromHeader(request);

    if (userId === null) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Missing x-user-id header'
      });
    }

    if (username === null) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Missing x-user-name header'
      });
    }

    const currentPool = poolRegistry.getCurrentPool(userId);
    if (currentPool && currentPool !== gameMode) {
      return reply.status(409).send({
        error: 'Conflict',
        message: `Already in ${currentPool} queue. Please leave first.`,
        currentPool
      });
    }

    try {
      const pool = pools[gameMode];
      const result = pool.joinPool(userId, username);

      if (result.success) {
        poolRegistry.registerUser(userId, gameMode);
      }

      request.log.info({ userId, gameMode, success: result.success }, 'User join pool attempt');

      // Attempt to pair now that the pool has a new player.
      // Fire-and-forget: pairing errors are logged but don't fail the join response.
      // Both players poll GET /match/:matchId or listen for a push notification to
      // discover the created match and roomId.
      if (result.success && pool.canFormPair()) {
        pool.tryAutoPair().then(pairResult => {
          if (pairResult.paired) {
            request.log.info({ userId, gameMode, matchId: pairResult.matchId }, 'Players paired');
            // Unregister both players — they're no longer in the queue
            poolRegistry.unregisterUser(pairResult.player1Id!);
            poolRegistry.unregisterUser(pairResult.player2Id!);
            // Notify both players via chat so they can acknowledge readiness
            chatServiceClient.sendMatchAck(
              pairResult.matchId!,
              [pairResult.player1Id!, pairResult.player2Id!],
              gameMode,
              pairResult.deadline!
            ).catch(err => {
              request.log.error({ err, matchId: pairResult.matchId }, 'Failed to send match-ack via chat');
            });
          }
        }).catch(err => {
          request.log.error({ err, userId, gameMode }, 'Auto-pair failed after join');
        });
      }

      return reply.status(200).send({
        success: result.success,
        gameMode,
        message: result.success
          ? `Successfully joined ${gameMode} matchmaking pool`
          : 'Already in pool'
      });
    } catch (error) {
      request.log.error({ error, userId, gameMode }, 'Error joining pool');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to join matchmaking pool'
      });
    }
  });

  /**
   * POST /matchmaking/:gameMode/leave
   * Remove current user from the matchmaking pool
   */
  server.post('/matchmaking/:gameMode/leave', async (request: FastifyRequest, reply: FastifyReply) => {
    const { gameMode } = request.params as { gameMode: string };

    if (!isValidGameMode(gameMode)) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid gameMode. Must be one of: classic, powerup'
      });
    }

    const userId = getUserIdFromHeader(request);

    if (userId === null) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Missing x-user-id header'
      });
    }

    const currentPool = poolRegistry.getCurrentPool(userId);
    if (currentPool && currentPool !== gameMode) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: `Not in ${gameMode} queue. Currently in ${currentPool} queue.`,
        currentPool
      });
    }

    try {
      const pool = pools[gameMode];
      const result = pool.leavePool(userId);

      if (result.success) {
        poolRegistry.unregisterUser(userId);
      }

      request.log.info({ userId, gameMode, success: result.success }, 'User leave pool attempt');

      return reply.status(200).send({
        success: result.success,
        gameMode,
        message: result.success
          ? `Successfully left ${gameMode} matchmaking pool`
          : 'Not in pool'
      });
    } catch (error) {
      request.log.error({ error, userId, gameMode }, 'Error leaving pool');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to leave matchmaking pool'
      });
    }
  });
}
