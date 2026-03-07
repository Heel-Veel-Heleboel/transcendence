import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MatchDao } from '../dao/match.js';
import { MatchReporting } from '../services/match-reporting.js';
import { getUserIdFromHeader } from './request-context.js';
import { GameServerClient } from '../services/game-server-client.js';
import { ChatServiceClient } from '../services/chat-service-client.js';
import { GatewayNotificationClient } from '../services/gateway-notification-client.js';

/**
 * Register match-related routes
 */
export async function registerMatchRoutes(
  server: FastifyInstance,
  matchDao: MatchDao,
  matchReporting: MatchReporting,
  gameServerClient: GameServerClient,
  chatServiceClient: ChatServiceClient,
  gatewayNotificationClient: GatewayNotificationClient
): Promise<void> {
  /**
   * POST /match/:matchId/acknowledge
   * Player acknowledges they are ready for the match.
   * When both players have acknowledged, a Colyseus room is created on the
   * game server and the roomId is stored as gameSessionId on the match.
   */
  server.post(
    '/match/:matchId/acknowledge',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { matchId } = request.params as { matchId: string };
      const userId = getUserIdFromHeader(request);

      if (userId === null) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Missing x-user-id header'
        });
      }

      try {
        const match = await matchDao.findById(matchId);

        if (!match) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Match not found'
          });
        }

        // Verify user is a player in this match
        if (match.player1Id !== userId && match.player2Id !== userId) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'You are not a player in this match'
          });
        }

        // Update acknowledgement — DAO transitions status to SCHEDULED when both have acked
        const updatedMatch = await matchDao.acknowledge(matchId, userId);
        const bothReady =
          updatedMatch.player1Acknowledged && updatedMatch.player2Acknowledged;

        // Both players are ready: provision the Colyseus room so they can connect
        let roomId: string | null = null;
        if (bothReady) {
          request.log.info(
            {
              matchId,
              player1Id: updatedMatch.player1Id,
              player2Id: updatedMatch.player2Id
            },
            'Both players acknowledged, creating game room'
          );
          try {
            roomId = await gameServerClient.createRoom(updatedMatch);
            await matchDao.setGameSessionId(matchId, roomId);
            // Notify both players with the roomId so they can connect to the game
            gatewayNotificationClient.notifyUsers(
              [updatedMatch.player1Id, updatedMatch.player2Id],
              {
                type: 'MATCH_READY',
                matchId,
                roomId,
                gameMode: updatedMatch.gameMode
              }
            );

            // Create a shared game channel for both players (fire-and-forget)
            chatServiceClient
              .createGameSessionChannel(
                [updatedMatch.player1Id, updatedMatch.player2Id],
                roomId
              )
              .catch(err => {
                request.log.error(
                  { err, matchId, roomId },
                  'Failed to create game session channel in chat'
                );
              });
          } catch (err) {
            request.log.error(
              { err, matchId },
              'Failed to create game room after both players acknowledged'
            );
            // Match stays SCHEDULED — a retry mechanism or admin intervention can recover
          }
        }

        return reply.status(200).send({
          success: true,
          matchId: updatedMatch.id,
          bothReady,
          roomId
        });
      } catch (error) {
        request.log.error(
          { error, matchId, userId },
          'Error acknowledging match'
        );
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to acknowledge match'
        });
      }
    }
  );

  /**
   * POST /match/:matchId/decline
   * Player declines the match. Match is cancelled (no scores, no winner).
   */
  server.post(
    '/match/:matchId/decline',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { matchId } = request.params as { matchId: string };
      const userId = getUserIdFromHeader(request);

      if (userId === null) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Missing x-user-id header'
        });
      }

      try {
        const updatedMatch = await matchDao.declineMatch(matchId, userId);
        request.log.info({ matchId, userId }, 'Match declined');

        return reply.status(200).send({
          success: true,
          matchId: updatedMatch.id,
          status: updatedMatch.status
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to decline match';
        const isValidation =
          message.includes('not found') ||
          message.includes('cannot decline') ||
          message.includes('not part of');
        request.log.error({ error, matchId, userId }, 'Error declining match');
        return reply.status(isValidation ? 400 : 500).send({
          error: isValidation ? 'Bad Request' : 'Internal Server Error',
          message
        });
      }
    }
  );

  /**
   * GET /match/:matchId
   * Get match details
   */
  server.get(
    '/match/:matchId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { matchId } = request.params as { matchId: string };

      try {
        const match = await matchDao.findById(matchId);

        if (!match) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Match not found'
          });
        }

        return reply.status(200).send(match);
      } catch (error) {
        request.log.error({ error, matchId }, 'Error getting match');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to get match details'
        });
      }
    }
  );

  /**
   * POST /match/:matchId/result
   * Report match result (called by game-service).
   * When isFinished is false the match is recorded as CANCELLED (premature end).
   */
  server.post(
    '/match/:matchId/result',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { matchId } = request.params as { matchId: string };
      const {
        winnerId,
        player1Score,
        player2Score,
        gameSessionId,
        isFinished
      } = request.body as {
        winnerId?: number;
        player1Score?: number;
        player2Score?: number;
        gameSessionId?: string;
        isFinished?: boolean;
      };

      // For finished matches, winnerId and scores are required
      if (
        isFinished &&
        (!winnerId || player1Score === undefined || player2Score === undefined)
      ) {
        return reply.status(400).send({
          error: 'Bad Request',
          message:
            'winnerId, player1Score, and player2Score are required for finished matches'
        });
      }

      try {
        const match = await matchDao.findById(matchId);

        if (!match) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Match not found'
          });
        }

        if (!isFinished) {
          // Game ended prematurely — cancel the match
          const updatedMatch = await matchDao.cancelMatch(matchId, {
            player1Score: player1Score ?? 0,
            player2Score: player2Score ?? 0,
            gameSessionId,
            resultSource: 'game_service_cancelled'
          });

          request.log.info(
            { matchId, player1Score, player2Score },
            'Match cancelled (premature end)'
          );

          return reply.status(200).send({
            success: true,
            matchId: updatedMatch.id,
            status: 'CANCELLED'
          });
        }

        // Verify winner is one of the players
        if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Invalid winnerId'
          });
        }

        // Update match with result
        const updatedMatch = await matchDao.completeMatch(matchId, {
          winnerId: winnerId!,
          player1Score: player1Score!,
          player2Score: player2Score!,
          gameSessionId,
          resultSource: 'game_service'
        });

        // Report result to user management (fire and forget, don't block response)
        matchReporting.reportMatchResult(updatedMatch).catch(err => {
          request.log.error(
            { error: err, matchId },
            'Failed to report match result to user management'
          );
        });

        request.log.info(
          { matchId, winnerId, player1Score, player2Score },
          'Match completed'
        );

        return reply.status(200).send({
          success: true,
          matchId: updatedMatch.id
        });
      } catch (error) {
        request.log.error({ error, matchId }, 'Error recording match result');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to record match result'
        });
      }
    }
  );
}
