import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TournamentService, TournamentError } from '../services/tournament.js';

/**
 * Register tournament routes
 *
 * Routes handle tournament lifecycle:
 * - Create/cancel tournaments
 * - Register/unregister for tournaments
 * - Get tournament info, matches, rankings
 *
 * TODO: Update API Gateway to forward user headers (x-user-id, x-user-name)
 * Then remove userId from request body and read from headers instead
 */
export async function registerTournamentRoutes(
  server: FastifyInstance,
  tournamentService: TournamentService
): Promise<void> {

  // ============================================================================
  // Tournament CRUD
  // ============================================================================

  /**
   * POST /tournament
   * Create a new tournament
   */
  server.post('/tournament', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as {
      name: string;
      format?: string;
      minPlayers?: number;
      maxPlayers?: number;
      matchDeadlineMin?: number;
      createdBy: number;
      registrationEnd: string;
      startTime?: string | null;
    };

    if (!body.name || typeof body.name !== 'string') {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'name is required and must be a string'
      });
    }

    if (!body.createdBy || typeof body.createdBy !== 'number') {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'createdBy is required and must be a number'
      });
    }

    if (!body.registrationEnd) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'registrationEnd is required'
      });
    }

    try {
      const tournament = await tournamentService.createTournament({
        name: body.name,
        format: body.format as 'round_robin' | 'single_elimination' | undefined,
        minPlayers: body.minPlayers,
        maxPlayers: body.maxPlayers,
        matchDeadlineMin: body.matchDeadlineMin,
        createdBy: body.createdBy,
        registrationEnd: new Date(body.registrationEnd),
        startTime: body.startTime ? new Date(body.startTime) : null
      });

      request.log.info({ tournamentId: tournament.id, createdBy: body.createdBy }, 'Tournament created');

      return reply.status(201).send({
        success: true,
        tournament
      });
    } catch (error) {
      if (error instanceof TournamentError) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: error.message,
          code: error.code
        });
      }
      request.log.error({ error }, 'Error creating tournament');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to create tournament'
      });
    }
  });

  /**
   * GET /tournament/:id
   * Get tournament details
   */
  server.get('/tournament/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const tournamentId = parseInt(id, 10);

    if (isNaN(tournamentId)) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid tournament ID'
      });
    }

    try {
      const tournament = await tournamentService.getTournamentSummary(tournamentId);

      if (!tournament) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Tournament not found'
        });
      }

      return reply.status(200).send({ tournament });
    } catch (error) {
      request.log.error({ error, tournamentId }, 'Error getting tournament');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get tournament'
      });
    }
  });

  /**
   * GET /tournament
   * Get list of open tournaments (accepting registrations)
   */
  server.get('/tournament', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const tournaments = await tournamentService.getOpenTournaments();

      return reply.status(200).send({ tournaments });
    } catch (error) {
      request.log.error({ error }, 'Error listing tournaments');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to list tournaments'
      });
    }
  });

  /**
   * POST /tournament/:id/cancel
   * Cancel a tournament (creator only)
   */
  server.post('/tournament/:id/cancel', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const tournamentId = parseInt(id, 10);
    const { userId } = request.body as { userId: number };

    if (isNaN(tournamentId)) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid tournament ID'
      });
    }

    if (!userId || typeof userId !== 'number') {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'userId is required and must be a number'
      });
    }

    try {
      const tournament = await tournamentService.cancelTournament(tournamentId, userId);

      request.log.info({ tournamentId, userId }, 'Tournament cancelled');

      return reply.status(200).send({
        success: true,
        tournament
      });
    } catch (error) {
      if (error instanceof TournamentError) {
        const status = error.code === 'NOT_FOUND' ? 404
          : error.code === 'UNAUTHORIZED' ? 403
          : 400;
        return reply.status(status).send({
          error: error.code === 'NOT_FOUND' ? 'Not Found'
            : error.code === 'UNAUTHORIZED' ? 'Forbidden'
            : 'Bad Request',
          message: error.message,
          code: error.code
        });
      }
      request.log.error({ error, tournamentId }, 'Error cancelling tournament');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to cancel tournament'
      });
    }
  });

  // ============================================================================
  // Registration
  // ============================================================================

  /**
   * POST /tournament/:id/register
   * Register for a tournament
   */
  server.post('/tournament/:id/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const tournamentId = parseInt(id, 10);
    const { userId, username } = request.body as { userId: number; username: string };

    if (isNaN(tournamentId)) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid tournament ID'
      });
    }

    if (!userId || typeof userId !== 'number') {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'userId is required and must be a number'
      });
    }

    if (!username || typeof username !== 'string') {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'username is required and must be a string'
      });
    }

    try {
      const { full } = await tournamentService.register(tournamentId, userId, username);

      request.log.info({ tournamentId, userId, full }, 'User registered for tournament');

      return reply.status(200).send({
        success: true,
        message: 'Successfully registered for tournament',
        full
      });
    } catch (error) {
      if (error instanceof TournamentError) {
        const status = error.code === 'NOT_FOUND' ? 404 : 400;
        return reply.status(status).send({
          error: status === 404 ? 'Not Found' : 'Bad Request',
          message: error.message,
          code: error.code
        });
      }
      request.log.error({ error, tournamentId, userId }, 'Error registering for tournament');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to register for tournament'
      });
    }
  });

  /**
   * POST /tournament/:id/unregister
   * Unregister from a tournament
   */
  server.post('/tournament/:id/unregister', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const tournamentId = parseInt(id, 10);
    const { userId } = request.body as { userId: number };

    if (isNaN(tournamentId)) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid tournament ID'
      });
    }

    if (!userId || typeof userId !== 'number') {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'userId is required and must be a number'
      });
    }

    try {
      await tournamentService.unregister(tournamentId, userId);

      request.log.info({ tournamentId, userId }, 'User unregistered from tournament');

      return reply.status(200).send({
        success: true,
        message: 'Successfully unregistered from tournament'
      });
    } catch (error) {
      if (error instanceof TournamentError) {
        const status = error.code === 'NOT_FOUND' ? 404 : 400;
        return reply.status(status).send({
          error: status === 404 ? 'Not Found' : 'Bad Request',
          message: error.message,
          code: error.code
        });
      }
      request.log.error({ error, tournamentId, userId }, 'Error unregistering from tournament');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to unregister from tournament'
      });
    }
  });

  // ============================================================================
  // Tournament Data
  // ============================================================================

  /**
   * GET /tournament/:id/rankings
   * Get current rankings/standings for a tournament
   */
  server.get('/tournament/:id/rankings', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const tournamentId = parseInt(id, 10);

    if (isNaN(tournamentId)) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid tournament ID'
      });
    }

    try {
      const rankings = await tournamentService.getRankings(tournamentId);

      return reply.status(200).send({ rankings });
    } catch (error) {
      if (error instanceof TournamentError) {
        return reply.status(404).send({
          error: 'Not Found',
          message: error.message,
          code: error.code
        });
      }
      request.log.error({ error, tournamentId }, 'Error getting rankings');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get rankings'
      });
    }
  });

  /**
   * GET /tournament/:id/matches
   * Get all matches for a tournament
   */
  server.get('/tournament/:id/matches', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const tournamentId = parseInt(id, 10);

    if (isNaN(tournamentId)) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid tournament ID'
      });
    }

    try {
      const matches = await tournamentService.getMatches(tournamentId);

      return reply.status(200).send({ matches });
    } catch (error) {
      request.log.error({ error, tournamentId }, 'Error getting matches');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get matches'
      });
    }
  });

  /**
   * GET /tournament/:id/participants
   * Get participant list for a tournament
   */
  server.get('/tournament/:id/participants', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const tournamentId = parseInt(id, 10);

    if (isNaN(tournamentId)) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid tournament ID'
      });
    }

    try {
      const participantIds = await tournamentService.getParticipantIds(tournamentId);

      return reply.status(200).send({
        tournamentId,
        participantIds,
        count: participantIds.length
      });
    } catch (error) {
      request.log.error({ error, tournamentId }, 'Error getting participants');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get participants'
      });
    }
  });
}
