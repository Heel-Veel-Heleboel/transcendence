import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MatchDao } from '../dao/match.js';
import { MatchReporting } from '../services/match-reporting.js';
import { MatchStatus } from '../../generated/prisma/index.js';
import { getUserIdFromHeader } from './request-context.js';

/**
 * Register match-related routes
 */
export async function registerMatchRoutes(
  server: FastifyInstance,
  matchDao: MatchDao,
  matchReporting: MatchReporting
): Promise<void> {

  /**
   * POST /match/:matchId/acknowledge
   * Player acknowledges they are ready for the match
   */
  server.post('/match/:matchId/acknowledge', async (request: FastifyRequest, reply: FastifyReply) => {
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

      // Update acknowledgement (DAO handles idempotency)
      const updatedMatch = await matchDao.acknowledge(matchId, userId);
      const bothReady = updatedMatch.player1Acknowledged && updatedMatch.player2Acknowledged;

      // If both ready, update status to SCHEDULED
      if (bothReady && updatedMatch.status === MatchStatus.PENDING_ACKNOWLEDGEMENT) {
        await matchDao.updateStatus(matchId, MatchStatus.SCHEDULED);
      }

      return reply.status(200).send({
        success: true,
        matchId: updatedMatch.id,
        bothReady
      });
    } catch (error) {
      request.log.error({ error, matchId, userId }, 'Error acknowledging match');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to acknowledge match'
      });
    }
  });

  /**
   * GET /match/:matchId
   * Get match details
   */
  server.get('/match/:matchId', async (request: FastifyRequest, reply: FastifyReply) => {
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
  });

  /**
   * POST /match/:matchId/result
   * Report match result (called by game-service)
   */
  server.post('/match/:matchId/result', async (request: FastifyRequest, reply: FastifyReply) => {
    const { matchId } = request.params as { matchId: string };
    const { winnerId, player1Score, player2Score, gameSessionId } = request.body as {
      winnerId: number;
      player1Score: number;
      player2Score: number;
      gameSessionId?: string;
    };

    if (!winnerId || player1Score === undefined || player2Score === undefined) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'winnerId, player1Score, and player2Score are required'
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

      // Verify winner is one of the players
      if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Invalid winnerId'
        });
      }

      // Update match with result
      const updatedMatch = await matchDao.completeMatch(matchId, {
        winnerId,
        player1Score,
        player2Score,
        gameSessionId,
        resultSource: 'game_service'
      });

      // Report result to user management (fire and forget, don't block response)
      matchReporting.reportMatchResult(updatedMatch).catch(err => {
        request.log.error({ error: err, matchId }, 'Failed to report match result to user management');
      });

      request.log.info({ matchId, winnerId, player1Score, player2Score }, 'Match completed');

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
  });
}
