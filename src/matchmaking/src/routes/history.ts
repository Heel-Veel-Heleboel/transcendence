import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MatchReporting } from '../services/match-reporting.js';

/**
 * Register match history routes
 */
export async function registerHistoryRoutes(
  server: FastifyInstance,
  matchReporting: MatchReporting
): Promise<void> {

  /**
   * GET /players/:userId/history
   * Get match history for a player
   */
  server.get('/players/:userId/history', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.params as { userId: string };
    const { limit } = request.query as { limit?: string };
    const userIdNum = parseInt(userId, 10);

    if (isNaN(userIdNum)) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid userId'
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
