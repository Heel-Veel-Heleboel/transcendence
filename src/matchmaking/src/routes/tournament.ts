import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TournamentService, TournamentError } from '../services/tournament.js';
import { TournamentLifecycleManager } from '../services/tournament-lifecycle.js';
import { getUserIdFromHeader, getUserNameFromHeader } from './request-context.js';

/**
 * Register tournament routes
 *
 * Routes handle tournament lifecycle:
 * - Create/cancel tournaments
 * - Register/unregister for tournaments
 * - Get tournament info, matches, rankings
 *
 */
export async function registerTournamentRoutes(
  server: FastifyInstance,
  tournamentService: TournamentService,
  lifecycleManager?: TournamentLifecycleManager
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
      registrationEnd: string;
      startTime?: string | null;
    };

    const createdBy = getUserIdFromHeader(request);
    if (!createdBy) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Missing x-user-id header'
      });
    }

    if (!body.name || typeof body.name !== 'string') {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'name is required and must be a string'
      });
    }

    if (body.name.length > 100) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'name must be 100 characters or less'
      });
    }

    if (!body.registrationEnd) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'registrationEnd is required'
      });
    }

    // Validate optional numeric fields
    if (body.minPlayers != null && (!Number.isInteger(body.minPlayers) || body.minPlayers < 2)) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'minPlayers must be an integer >= 2'
      });
    }

    if (body.maxPlayers != null && (!Number.isInteger(body.maxPlayers) || body.maxPlayers < 2)) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'maxPlayers must be an integer >= 2'
      });
    }

    if (body.matchDeadlineMin != null && (typeof body.matchDeadlineMin !== 'number' || body.matchDeadlineMin <= 0)) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'matchDeadlineMin must be a positive number'
      });
    }

    // Validate date parsing
    const registrationEnd = new Date(body.registrationEnd);
    if (isNaN(registrationEnd.getTime())) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'registrationEnd is not a valid date'
      });
    }

    let startTime: Date | null = null;
    if (body.startTime) {
      startTime = new Date(body.startTime);
      if (isNaN(startTime.getTime())) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'startTime is not a valid date'
        });
      }
    }

    try {
      const tournament = await tournamentService.createTournament({
        name: body.name.trim(),
        format: body.format as 'round_robin' | 'single_elimination' | undefined,
        minPlayers: body.minPlayers,
        maxPlayers: body.maxPlayers,
        matchDeadlineMin: body.matchDeadlineMin,
        createdBy,
        registrationEnd,
        startTime
      });

      request.log.info({ tournamentId: tournament.id, createdBy }, 'Tournament created');

      // Schedule registration end timer
      lifecycleManager?.onTournamentCreated(tournament);

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
    const userId = getUserIdFromHeader(request);

    if (isNaN(tournamentId)) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid tournament ID'
      });
    }

    if (!userId) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Missing x-user-id header'
      });
    }

    try {
      const tournament = await tournamentService.cancelTournament(tournamentId, userId);

      // Cancel any pending lifecycle timers
      lifecycleManager?.onTournamentCancelled(tournamentId);

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
    const userId = getUserIdFromHeader(request);
    const username = getUserNameFromHeader(request);

    if (isNaN(tournamentId)) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid tournament ID'
      });
    }

    if (!userId) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Missing x-user-id header'
      });
    }

    if (!username) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Missing x-user-name header'
      });
    }

    try {
      const { full } = await tournamentService.register(tournamentId, userId, username);

      request.log.info({ tournamentId, userId, full }, 'User registered for tournament');

      // If tournament is now full, trigger early registration close
      if (full) {
        lifecycleManager?.onRegistrationFull(tournamentId).catch(err => {
          request.log.error({ error: err, tournamentId }, 'Error handling registration full');
        });
      }

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
    const userId = getUserIdFromHeader(request);

    if (isNaN(tournamentId)) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid tournament ID'
      });
    }

    if (!userId) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Missing x-user-id header'
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
