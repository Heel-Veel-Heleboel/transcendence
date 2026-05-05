import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TournamentService, TournamentError } from '../services/tournament.js';
import { TournamentScheduler } from '../services/tournament-scheduler.js';
import { GatewayNotificationClient } from '../clients/gateway-notification-client.js';
import { getUserIdFromHeader, getUserNameFromHeader } from './request-context.js';
import { GameMode, isValidGameMode } from '../types/match.js';
import {
  DEFAULT_MIN_PLAYERS,
  DEFAULT_MAX_PLAYERS,
  DEFAULT_MATCH_DURATION_MIN,
  DEFAULT_ACK_DEADLINE_MIN,
  DEFAULT_REGISTRATION_DURATION_MIN
} from '../types/tournament.js';

export async function registerTournamentRoutes(
  server: FastifyInstance,
  tournamentService: TournamentService,
  gatewayNotificationClient: GatewayNotificationClient,
  scheduler?: TournamentScheduler
): Promise<void> {

  server.post('/matchmaking/tournament', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as { name: string; gameMode?: string };

    const createdBy = getUserIdFromHeader(request);
    if (createdBy === null) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Missing x-user-id header' });
    }

    const creatorUsername = getUserNameFromHeader(request);
    if (creatorUsername === null) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Missing x-user-name header' });
    }

    if (!body.name || typeof body.name !== 'string') {
      return reply.status(400).send({ error: 'Bad Request', message: 'name is required and must be a string' });
    }

    const trimmedName = body.name.trim();

    if (trimmedName.length < 2) {
      return reply.status(400).send({ error: 'Bad Request', message: 'name must be at least 2 characters' });
    }

    if (trimmedName.length > 100) {
      return reply.status(400).send({ error: 'Bad Request', message: 'name must be 100 characters or less' });
    }

    if (!/^[a-zA-Z0-9 _\-().]+$/.test(trimmedName)) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'name may only contain letters, numbers, spaces, and the characters: _ - ( ) .'
      });
    }

    let gameMode: GameMode = 'classic';
    if (body.gameMode != null) {
      if (!isValidGameMode(body.gameMode)) {
        return reply.status(400).send({ error: 'Bad Request', message: 'gameMode must be one of: classic, powerup' });
      }
      gameMode = body.gameMode;
    }

    const registrationEnd = new Date(Date.now() + DEFAULT_REGISTRATION_DURATION_MIN * 60 * 1000);

    try {
      const tournament = await tournamentService.createTournament({
        name: trimmedName,
        gameMode,
        minPlayers: DEFAULT_MIN_PLAYERS,
        maxPlayers: DEFAULT_MAX_PLAYERS,
        matchDurationMin: DEFAULT_MATCH_DURATION_MIN,
        ackDeadlineMin: DEFAULT_ACK_DEADLINE_MIN,
        createdBy,
        creatorUsername,
        registrationEnd,
        startTime: null
      });

      request.log.info({ tournamentId: tournament.id, createdBy }, 'Tournament created');
      scheduler?.onTournamentCreated(tournament);
      gatewayNotificationClient.broadcastEvent({ type: 'TOURNAMENT_UPDATE', tournamentId: tournament.id });

      return reply.status(201).send({ success: true, tournament });
    } catch (error) {
      if (error instanceof TournamentError) {
        return reply.status(400).send({ error: 'Bad Request', message: error.message, code: error.code });
      }
      request.log.error({ error }, 'Error creating tournament');
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to create tournament' });
    }
  });

  server.get('/matchmaking/tournament/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const tournamentId = parseInt(id, 10);

    if (isNaN(tournamentId)) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Invalid tournament ID' });
    }

    try {
      const tournament = await tournamentService.getTournamentSummary(tournamentId);

      if (!tournament) {
        return reply.status(404).send({ error: 'Not Found', message: 'Tournament not found' });
      }

      return reply.status(200).send({ tournament });
    } catch (error) {
      request.log.error({ error, tournamentId }, 'Error getting tournament');
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to get tournament' });
    }
  });

  server.get('/matchmaking/tournament', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const tournaments = await tournamentService.getOpenTournaments();
      return reply.status(200).send({ tournaments });
    } catch (error) {
      request.log.error({ error }, 'Error listing tournaments');
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to list tournaments' });
    }
  });

  server.post('/matchmaking/tournament/:id/cancel', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const tournamentId = parseInt(id, 10);
    const userId = getUserIdFromHeader(request);

    if (isNaN(tournamentId)) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Invalid tournament ID' });
    }

    if (userId === null) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Missing x-user-id header' });
    }

    try {
      const tournament = await tournamentService.cancelTournament(tournamentId, userId);
      scheduler?.onTournamentCancelled(tournamentId);
      request.log.info({ tournamentId, userId }, 'Tournament cancelled');
      gatewayNotificationClient.broadcastEvent({ type: 'TOURNAMENT_UPDATE', tournamentId });

      return reply.status(200).send({ success: true, tournament });
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
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to cancel tournament' });
    }
  });

  server.post('/matchmaking/tournament/:id/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const tournamentId = parseInt(id, 10);
    const userId = getUserIdFromHeader(request);
    const username = getUserNameFromHeader(request);

    if (isNaN(tournamentId)) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Invalid tournament ID' });
    }

    if (userId === null) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Missing x-user-id header' });
    }

    if (username === null) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Missing x-user-name header' });
    }

    try {
      const { full } = await tournamentService.register(tournamentId, userId, username);
      request.log.info({ tournamentId, userId, full }, 'User registered for tournament');
      gatewayNotificationClient.broadcastEvent({ type: 'TOURNAMENT_UPDATE', tournamentId });

      if (full) {
        scheduler?.onRegistrationFull(tournamentId).catch(err => {
          request.log.error({ error: err, tournamentId }, 'Error handling registration full');
        });
      }

      return reply.status(200).send({ success: true, message: 'Successfully registered for tournament', full });
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
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to register for tournament' });
    }
  });

  server.post('/matchmaking/tournament/:id/unregister', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const tournamentId = parseInt(id, 10);
    const userId = getUserIdFromHeader(request);

    if (isNaN(tournamentId)) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Invalid tournament ID' });
    }

    if (userId === null) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Missing x-user-id header' });
    }

    try {
      await tournamentService.unregister(tournamentId, userId);
      request.log.info({ tournamentId, userId }, 'User unregistered from tournament');
      gatewayNotificationClient.broadcastEvent({ type: 'TOURNAMENT_UPDATE', tournamentId });

      return reply.status(200).send({ success: true, message: 'Successfully unregistered from tournament' });
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
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to unregister from tournament' });
    }
  });

  /**
   * Leave an in-progress tournament. Forfeits the player's next pending match (opponent
   * wins 5-0), advances the bracket, and frees the player to join other games/tournaments.
   */
  server.post('/matchmaking/tournament/:id/leave', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const tournamentId = parseInt(id, 10);
    const userId = getUserIdFromHeader(request);

    if (isNaN(tournamentId)) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Invalid tournament ID' });
    }

    if (userId === null) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Missing x-user-id header' });
    }

    try {
      const forfeited = await tournamentService.leaveTournament(tournamentId, userId);

      if (forfeited) {
        scheduler?.onMatchCompleted(forfeited).catch(err => {
          request.log.error({ error: err, tournamentId }, 'Error processing bracket after leave');
        });
        gatewayNotificationClient.notifyUsers(
          [forfeited.player1Id, forfeited.player2Id],
          { type: 'MATCH_FINISHED' }
        );
      }

      gatewayNotificationClient.broadcastEvent({ type: 'TOURNAMENT_UPDATE', tournamentId });
      request.log.info({ tournamentId, userId, matchId: forfeited?.id ?? null }, 'User left tournament');

      return reply.status(200).send({ success: true, message: 'Successfully left tournament' });
    } catch (error) {
      if (error instanceof TournamentError) {
        const status = error.code === 'NOT_FOUND' ? 404
          : error.code === 'NOT_PARTICIPANT' || error.code === 'ALREADY_ELIMINATED' ? 403
            : 400;
        return reply.status(status).send({
          error: status === 404 ? 'Not Found' : status === 403 ? 'Forbidden' : 'Bad Request',
          message: error.message,
          code: error.code
        });
      }
      request.log.error({ error, tournamentId, userId }, 'Error leaving tournament');
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to leave tournament' });
    }
  });

  server.get('/matchmaking/tournament/:id/rankings', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const tournamentId = parseInt(id, 10);

    if (isNaN(tournamentId)) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Invalid tournament ID' });
    }

    try {
      const rankings = await tournamentService.getRankings(tournamentId);
      return reply.status(200).send({ rankings });
    } catch (error) {
      if (error instanceof TournamentError) {
        return reply.status(404).send({ error: 'Not Found', message: error.message, code: error.code });
      }
      request.log.error({ error, tournamentId }, 'Error getting rankings');
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to get rankings' });
    }
  });

  /**
   * GET /matchmaking/tournament/:id/matches
   * Returns bracket as a binary tree array: index 0 = final, children of node i at 2i+1 and 2i+2.
   * Total size = 2^totalRounds - 1. TBD nodes fill unplayed slots.
   */
  server.get('/matchmaking/tournament/:id/matches', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const tournamentId = parseInt(id, 10);

    if (isNaN(tournamentId)) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Invalid tournament ID' });
    }

    try {
      const bracket = await tournamentService.getBracket(tournamentId);
      return reply.status(200).send(bracket);
    } catch (error) {
      if (error instanceof TournamentError && error.code === 'NOT_FOUND') {
        return reply.status(404).send({ error: 'Not Found', message: 'Tournament not found', code: error.code });
      }
      request.log.error({ error, tournamentId }, 'Error getting bracket');
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to get bracket' });
    }
  });

  server.get('/matchmaking/tournament/:id/participants', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const tournamentId = parseInt(id, 10);

    if (isNaN(tournamentId)) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Invalid tournament ID' });
    }

    try {
      const participantIds = await tournamentService.getParticipantIds(tournamentId);
      return reply.status(200).send({ tournamentId, participantIds, count: participantIds.length });
    } catch (error) {
      request.log.error({ error, tournamentId }, 'Error getting participants');
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to get participants' });
    }
  });
}
