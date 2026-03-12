import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MatchmakingService } from '../services/casual-matchmaking.js';
import { PoolRegistry } from '../services/pool-registry.js';
import { ChatServiceClient } from '../services/chat-service-client.js';
import { MatchDao } from '../dao/match.js';
import { TournamentParticipantDao } from '../dao/tournament-participant.js';
import { isValidGameMode, GameMode } from '../types/match.js';
import { getUserIdFromHeader, getUserNameFromHeader } from './request-context.js';
import { GatewayNotificationClient } from '../services/gateway-notification-client.js';

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
  chatServiceClient: ChatServiceClient,
  gatewayNotificationClient: GatewayNotificationClient,
  matchDao: MatchDao,
  participantDao: TournamentParticipantDao
): Promise<void> {

  /**
   * GET /matchmaking/status/me
   * Unified status check — returns the user's current matchmaking state.
   *
   * Possible states:
   *   'free'                       - not in pool, not in tournament, no active match
   *   'in_pool'                    - waiting in a matchmaking queue
   *   'match_pending_ack'          - match found, waiting for acknowledgement (casual or tournament)
   *   'in_tournament_registration' - registered in a tournament still accepting players
   *   'in_tournament_active'       - in an ongoing tournament (SCHEDULED or IN_PROGRESS)
   */
  server.get('/matchmaking/status/me', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserIdFromHeader(request);
    if (userId === null) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Missing x-user-id header' });
    }

    try {
      // Check for an active match first — pool unregistering happens asynchronously
      // around pairing, so there's a window where a match exists in DB but the user
      // is still registered in-memory. DB is the source of truth.
      const activeMatch = await matchDao.findActiveMatchForUser(userId);
      if (activeMatch) {
        const matchState = activeMatch.status === 'PENDING_ACKNOWLEDGEMENT'
          ? 'match_pending_ack'
          : activeMatch.status === 'SCHEDULED'
            ? 'match_scheduled'
            : 'match_in_progress';
        return reply.status(200).send({
          state: matchState,
          poolGameMode: null,
          activeMatchId: activeMatch.id,
          activeTournamentId: activeMatch.tournamentId ?? null,
          tournamentStatus: null,
          isCreator: false
        });
      }

      // Check pool membership (in-memory, only meaningful when no active match)
      const poolGameMode = poolRegistry.getCurrentPool(userId) ?? null;
      if (poolGameMode) {
        return reply.status(200).send({
          state: 'in_pool',
          poolGameMode,
          activeMatchId: null,
          activeTournamentId: null,
          tournamentStatus: null,
          isCreator: false
        });
      }

      // Check tournament participation
      const activeTournament = await participantDao.getActiveTournament(userId);
      if (activeTournament) {
        const isRegistration = activeTournament.tournamentStatus === 'REGISTRATION';
        return reply.status(200).send({
          state: isRegistration ? 'in_tournament_registration' : 'in_tournament_active',
          poolGameMode: null,
          activeMatchId: null,
          activeTournamentId: activeTournament.tournamentId,
          tournamentStatus: activeTournament.tournamentStatus,
          isCreator: activeTournament.createdBy === userId
        });
      }

      return reply.status(200).send({
        state: 'free',
        poolGameMode: null,
        activeMatchId: null,
        activeTournamentId: null,
        tournamentStatus: null,
        isCreator: false
      });
    } catch (error) {
      request.log.error({ error, userId }, 'Error fetching matchmaking status');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch matchmaking status'
      });
    }
  });

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
        gatewayNotificationClient.notifyUsers(
          [userId],
          {
            type: 'MATCH_JOINED_POOL'
          }
        );
      }

      request.log.info({ userId, gameMode, success: result.success }, 'User join pool attempt');

      // Attempt to pair now that the pool has a new player.
      // Fire-and-forget: pairing errors are logged but don't fail the join response.
      // Both players poll GET /match/:matchId or listen for a push notification to
      // discover the created match and roomId.
      if (result.success && pool.canFormPair()) {
        pool.tryAutoPair().then(pairResult => {
          if (pairResult.paired && pairResult.matchId && pairResult.player1Id && pairResult.player2Id && pairResult.deadline) {
            request.log.info({ userId, gameMode, matchId: pairResult.matchId }, 'Players paired');
            // Unregister both players — they're no longer in the queue
            poolRegistry.unregisterUser(pairResult.player1Id);
            poolRegistry.unregisterUser(pairResult.player2Id);
            // Notify both players via chat so they can acknowledge readiness
            chatServiceClient.sendMatchAck(
              pairResult.matchId,
              [pairResult.player1Id, pairResult.player2Id],
              gameMode,
              pairResult.deadline
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
        gatewayNotificationClient.notifyUsers(
          [userId],
          {
            type: 'MATCH_LEAVED_POOL'
          }
        );
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
