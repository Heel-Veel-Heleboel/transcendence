import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MatchReporting } from '../services/match-reporting.js';
import { getUserIdFromHeader } from './request-context.js';

/**
 * Register match history routes
 */
export async function registerHistoryRoutes(
  server: FastifyInstance,
  matchReporting: MatchReporting
): Promise<void> {

  /**
   * GET /players/history
   * Get match history for the authenticated player
   */
  server.get('/players/history', async (request: FastifyRequest, reply: FastifyReply) => {
    const { limit } = request.query as { limit?: string };
    const userIdNum = getUserIdFromHeader(request);

    if (userIdNum === null) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Missing x-user-id header'
      });
    }

    let limitNum: number | undefined;
    if (limit) {
      limitNum = parseInt(limit, 10);
      if (isNaN(limitNum) || limitNum < 1) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'limit must be a positive number'
        });
      }
    }

    try {
      const history = await matchReporting.getMatchHistory(userIdNum, limitNum);

      return reply.status(200).send({
        userId: userIdNum,
        matches: history,
        count: history.length
      });
    } catch (error) {
      request.log.error({ error, userId: userIdNum }, 'Error getting match history');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get match history'
      });
    }
  });
}
