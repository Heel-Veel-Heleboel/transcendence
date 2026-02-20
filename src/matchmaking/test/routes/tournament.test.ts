import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { registerTournamentRoutes } from '../../src/routes/tournament.js';
import { TournamentService, TournamentError } from '../../src/services/tournament.js';
import { TournamentStatus } from '../../generated/prisma/index.js';

describe('Tournament Routes', () => {
  let server: FastifyInstance;
  let mockTournamentService: TournamentService;

  const mockTournament = {
    id: 1,
    name: 'Test Tournament',
    format: 'round_robin',
    status: 'REGISTRATION' as TournamentStatus,
    minPlayers: 4,
    maxPlayers: 8,
    matchDeadlineMin: 30,
    createdBy: 100,
    registrationEnd: new Date('2099-12-31'),
    startTime: null,
    endTime: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockTournamentSummary = {
    id: 1,
    name: 'Test Tournament',
    format: 'round_robin',
    status: 'REGISTRATION' as TournamentStatus,
    minPlayers: 4,
    maxPlayers: 8,
    participantCount: 3,
    registrationEnd: new Date('2099-12-31'),
    startTime: null,
    createdBy: 100,
    createdAt: new Date()
  };

  beforeEach(async () => {
    server = Fastify();

    mockTournamentService = {
      createTournament: vi.fn().mockResolvedValue(mockTournament),
      getTournamentSummary: vi.fn().mockResolvedValue(mockTournamentSummary),
      getOpenTournaments: vi.fn().mockResolvedValue([mockTournamentSummary]),
      cancelTournament: vi.fn().mockResolvedValue({ ...mockTournament, status: 'CANCELLED' }),
      register: vi.fn().mockResolvedValue(undefined),
      unregister: vi.fn().mockResolvedValue(undefined),
      getRankings: vi.fn().mockResolvedValue([
        { rank: 1, userId: 101, wins: 2, losses: 0, scoreDiff: 10, matchesPlayed: 2 },
        { rank: 2, userId: 102, wins: 1, losses: 1, scoreDiff: 0, matchesPlayed: 2 }
      ]),
      getMatches: vi.fn().mockResolvedValue([
        { id: 1, player1Id: 101, player2Id: 102, tournamentId: 1, status: 'PENDING' }
      ]),
      getParticipantIds: vi.fn().mockResolvedValue([101, 102, 103])
    } as any;

    await registerTournamentRoutes(server, mockTournamentService);
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  // ============================================================================
  // POST /tournament - Create Tournament
  // ============================================================================

  describe('POST /tournament', () => {
    it('should create a tournament successfully', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/tournament',
        payload: {
          name: 'Test Tournament',
          createdBy: 100,
          registrationEnd: '2099-12-31T00:00:00Z'
        }
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.tournament).toBeDefined();
      expect(body.tournament.name).toBe('Test Tournament');
      expect(mockTournamentService.createTournament).toHaveBeenCalledWith({
        name: 'Test Tournament',
        format: undefined,
        minPlayers: undefined,
        maxPlayers: undefined,
        matchDeadlineMin: undefined,
        createdBy: 100,
        registrationEnd: new Date('2099-12-31T00:00:00Z'),
        startTime: null
      });
    });

    it('should create a tournament with all optional fields', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/tournament',
        payload: {
          name: 'Full Tournament',
          format: 'single_elimination',
          minPlayers: 8,
          maxPlayers: 16,
          matchDeadlineMin: 60,
          createdBy: 100,
          registrationEnd: '2099-12-31T00:00:00Z',
          startTime: '2100-01-01T00:00:00Z'
        }
      });

      expect(response.statusCode).toBe(201);
      expect(mockTournamentService.createTournament).toHaveBeenCalledWith({
        name: 'Full Tournament',
        format: 'single_elimination',
        minPlayers: 8,
        maxPlayers: 16,
        matchDeadlineMin: 60,
        createdBy: 100,
        registrationEnd: new Date('2099-12-31T00:00:00Z'),
        startTime: new Date('2100-01-01T00:00:00Z')
      });
    });

    it('should return 400 when name is missing', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/tournament',
        payload: {
          createdBy: 100,
          registrationEnd: '2099-12-31T00:00:00Z'
        }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('name');
    });

    it('should return 400 when createdBy is missing', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/tournament',
        payload: {
          name: 'Test Tournament',
          registrationEnd: '2099-12-31T00:00:00Z'
        }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('createdBy');
    });

    it('should return 400 when registrationEnd is missing', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/tournament',
        payload: {
          name: 'Test Tournament',
          createdBy: 100
        }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('registrationEnd');
    });

    it('should return 400 on TournamentError', async () => {
      vi.mocked(mockTournamentService.createTournament).mockRejectedValue(
        new TournamentError('Registration end must be in the future', 'INVALID_REGISTRATION_END')
      );

      const response = await server.inject({
        method: 'POST',
        url: '/tournament',
        payload: {
          name: 'Test Tournament',
          createdBy: 100,
          registrationEnd: '2099-12-31T00:00:00Z'
        }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.code).toBe('INVALID_REGISTRATION_END');
    });

    it('should return 500 on unexpected error', async () => {
      vi.mocked(mockTournamentService.createTournament).mockRejectedValue(
        new Error('Database error')
      );

      const response = await server.inject({
        method: 'POST',
        url: '/tournament',
        payload: {
          name: 'Test Tournament',
          createdBy: 100,
          registrationEnd: '2099-12-31T00:00:00Z'
        }
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal Server Error');
    });
  });

  // ============================================================================
  // GET /tournament/:id - Get Tournament
  // ============================================================================

  describe('GET /tournament/:id', () => {
    it('should get tournament details', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/tournament/1'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.tournament).toBeDefined();
      expect(body.tournament.id).toBe(1);
      expect(mockTournamentService.getTournamentSummary).toHaveBeenCalledWith(1);
    });

    it('should return 400 for invalid tournament ID', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/tournament/invalid'
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('Invalid tournament ID');
    });

    it('should return 404 when tournament not found', async () => {
      vi.mocked(mockTournamentService.getTournamentSummary).mockResolvedValue(null);

      const response = await server.inject({
        method: 'GET',
        url: '/tournament/999'
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Not Found');
    });

    it('should return 500 on unexpected error', async () => {
      vi.mocked(mockTournamentService.getTournamentSummary).mockRejectedValue(
        new Error('Database error')
      );

      const response = await server.inject({
        method: 'GET',
        url: '/tournament/1'
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal Server Error');
    });
  });

  // ============================================================================
  // GET /tournament - List Tournaments
  // ============================================================================

  describe('GET /tournament', () => {
    it('should list open tournaments', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/tournament'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.tournaments).toBeDefined();
      expect(Array.isArray(body.tournaments)).toBe(true);
      expect(mockTournamentService.getOpenTournaments).toHaveBeenCalled();
    });

    it('should return empty array when no open tournaments', async () => {
      vi.mocked(mockTournamentService.getOpenTournaments).mockResolvedValue([]);

      const response = await server.inject({
        method: 'GET',
        url: '/tournament'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.tournaments).toEqual([]);
    });

    it('should return 500 on unexpected error', async () => {
      vi.mocked(mockTournamentService.getOpenTournaments).mockRejectedValue(
        new Error('Database error')
      );

      const response = await server.inject({
        method: 'GET',
        url: '/tournament'
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal Server Error');
    });
  });

  // ============================================================================
  // POST /tournament/:id/cancel - Cancel Tournament
  // ============================================================================

  describe('POST /tournament/:id/cancel', () => {
    it('should cancel a tournament successfully', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/tournament/1/cancel',
        payload: { userId: 100 }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.tournament.status).toBe('CANCELLED');
      expect(mockTournamentService.cancelTournament).toHaveBeenCalledWith(1, 100);
    });

    it('should return 400 for invalid tournament ID', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/tournament/invalid/cancel',
        payload: { userId: 100 }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('Invalid tournament ID');
    });

    it('should return 400 when userId is missing', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/tournament/1/cancel',
        payload: {}
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('userId');
    });

    it('should return 404 when tournament not found', async () => {
      vi.mocked(mockTournamentService.cancelTournament).mockRejectedValue(
        new TournamentError('Tournament not found', 'NOT_FOUND')
      );

      const response = await server.inject({
        method: 'POST',
        url: '/tournament/999/cancel',
        payload: { userId: 100 }
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Not Found');
      expect(body.code).toBe('NOT_FOUND');
    });

    it('should return 403 when user is not the creator', async () => {
      vi.mocked(mockTournamentService.cancelTournament).mockRejectedValue(
        new TournamentError('Only the creator can cancel the tournament', 'UNAUTHORIZED')
      );

      const response = await server.inject({
        method: 'POST',
        url: '/tournament/1/cancel',
        payload: { userId: 999 }
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Forbidden');
      expect(body.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 when tournament cannot be cancelled', async () => {
      vi.mocked(mockTournamentService.cancelTournament).mockRejectedValue(
        new TournamentError('Cannot cancel tournament that is in progress or completed', 'INVALID_STATUS')
      );

      const response = await server.inject({
        method: 'POST',
        url: '/tournament/1/cancel',
        payload: { userId: 100 }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.code).toBe('INVALID_STATUS');
    });

    it('should return 500 on unexpected error', async () => {
      vi.mocked(mockTournamentService.cancelTournament).mockRejectedValue(
        new Error('Database error')
      );

      const response = await server.inject({
        method: 'POST',
        url: '/tournament/1/cancel',
        payload: { userId: 100 }
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal Server Error');
    });
  });

  // ============================================================================
  // POST /tournament/:id/register - Register for Tournament
  // ============================================================================

  describe('POST /tournament/:id/register', () => {
    it('should register for a tournament successfully', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/tournament/1/register',
        payload: { userId: 101 }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.message).toContain('registered');
      expect(mockTournamentService.register).toHaveBeenCalledWith(1, 101);
    });

    it('should return 400 for invalid tournament ID', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/tournament/invalid/register',
        payload: { userId: 101 }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('Invalid tournament ID');
    });

    it('should return 400 when userId is missing', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/tournament/1/register',
        payload: {}
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('userId');
    });

    it('should return 404 when tournament not found', async () => {
      vi.mocked(mockTournamentService.register).mockRejectedValue(
        new TournamentError('Tournament not found', 'NOT_FOUND')
      );

      const response = await server.inject({
        method: 'POST',
        url: '/tournament/999/register',
        payload: { userId: 101 }
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Not Found');
      expect(body.code).toBe('NOT_FOUND');
    });

    it('should return 400 when registration is closed', async () => {
      vi.mocked(mockTournamentService.register).mockRejectedValue(
        new TournamentError('Tournament is not open for registration', 'REGISTRATION_CLOSED')
      );

      const response = await server.inject({
        method: 'POST',
        url: '/tournament/1/register',
        payload: { userId: 101 }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.code).toBe('REGISTRATION_CLOSED');
    });

    it('should return 400 when already registered', async () => {
      vi.mocked(mockTournamentService.register).mockRejectedValue(
        new TournamentError('Already registered for this tournament', 'ALREADY_REGISTERED')
      );

      const response = await server.inject({
        method: 'POST',
        url: '/tournament/1/register',
        payload: { userId: 101 }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.code).toBe('ALREADY_REGISTERED');
    });

    it('should return 400 when tournament is full', async () => {
      vi.mocked(mockTournamentService.register).mockRejectedValue(
        new TournamentError('Tournament is full', 'TOURNAMENT_FULL')
      );

      const response = await server.inject({
        method: 'POST',
        url: '/tournament/1/register',
        payload: { userId: 101 }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.code).toBe('TOURNAMENT_FULL');
    });

    it('should return 500 on unexpected error', async () => {
      vi.mocked(mockTournamentService.register).mockRejectedValue(
        new Error('Database error')
      );

      const response = await server.inject({
        method: 'POST',
        url: '/tournament/1/register',
        payload: { userId: 101 }
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal Server Error');
    });
  });

  // ============================================================================
  // POST /tournament/:id/unregister - Unregister from Tournament
  // ============================================================================

  describe('POST /tournament/:id/unregister', () => {
    it('should unregister from a tournament successfully', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/tournament/1/unregister',
        payload: { userId: 101 }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.message).toContain('unregistered');
      expect(mockTournamentService.unregister).toHaveBeenCalledWith(1, 101);
    });

    it('should return 400 for invalid tournament ID', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/tournament/invalid/unregister',
        payload: { userId: 101 }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('Invalid tournament ID');
    });

    it('should return 400 when userId is missing', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/tournament/1/unregister',
        payload: {}
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('userId');
    });

    it('should return 404 when tournament not found', async () => {
      vi.mocked(mockTournamentService.unregister).mockRejectedValue(
        new TournamentError('Tournament not found', 'NOT_FOUND')
      );

      const response = await server.inject({
        method: 'POST',
        url: '/tournament/999/unregister',
        payload: { userId: 101 }
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Not Found');
      expect(body.code).toBe('NOT_FOUND');
    });

    it('should return 400 when registration is closed', async () => {
      vi.mocked(mockTournamentService.unregister).mockRejectedValue(
        new TournamentError('Cannot unregister after registration closes', 'REGISTRATION_CLOSED')
      );

      const response = await server.inject({
        method: 'POST',
        url: '/tournament/1/unregister',
        payload: { userId: 101 }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.code).toBe('REGISTRATION_CLOSED');
    });

    it('should return 400 when not registered', async () => {
      vi.mocked(mockTournamentService.unregister).mockRejectedValue(
        new TournamentError('Not registered for this tournament', 'NOT_REGISTERED')
      );

      const response = await server.inject({
        method: 'POST',
        url: '/tournament/1/unregister',
        payload: { userId: 101 }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.code).toBe('NOT_REGISTERED');
    });

    it('should return 500 on unexpected error', async () => {
      vi.mocked(mockTournamentService.unregister).mockRejectedValue(
        new Error('Database error')
      );

      const response = await server.inject({
        method: 'POST',
        url: '/tournament/1/unregister',
        payload: { userId: 101 }
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal Server Error');
    });
  });

  // ============================================================================
  // GET /tournament/:id/rankings - Get Rankings
  // ============================================================================

  describe('GET /tournament/:id/rankings', () => {
    it('should get tournament rankings', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/tournament/1/rankings'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.rankings).toBeDefined();
      expect(Array.isArray(body.rankings)).toBe(true);
      expect(body.rankings.length).toBe(2);
      expect(body.rankings[0].rank).toBe(1);
      expect(mockTournamentService.getRankings).toHaveBeenCalledWith(1);
    });

    it('should return 400 for invalid tournament ID', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/tournament/invalid/rankings'
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('Invalid tournament ID');
    });

    it('should return 404 when tournament not found', async () => {
      vi.mocked(mockTournamentService.getRankings).mockRejectedValue(
        new TournamentError('Tournament not found', 'NOT_FOUND')
      );

      const response = await server.inject({
        method: 'GET',
        url: '/tournament/999/rankings'
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Not Found');
      expect(body.code).toBe('NOT_FOUND');
    });

    it('should return 500 on unexpected error', async () => {
      vi.mocked(mockTournamentService.getRankings).mockRejectedValue(
        new Error('Database error')
      );

      const response = await server.inject({
        method: 'GET',
        url: '/tournament/1/rankings'
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal Server Error');
    });
  });

  // ============================================================================
  // GET /tournament/:id/matches - Get Matches
  // ============================================================================

  describe('GET /tournament/:id/matches', () => {
    it('should get tournament matches', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/tournament/1/matches'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.matches).toBeDefined();
      expect(Array.isArray(body.matches)).toBe(true);
      expect(mockTournamentService.getMatches).toHaveBeenCalledWith(1);
    });

    it('should return 400 for invalid tournament ID', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/tournament/invalid/matches'
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('Invalid tournament ID');
    });

    it('should return empty array when no matches', async () => {
      vi.mocked(mockTournamentService.getMatches).mockResolvedValue([]);

      const response = await server.inject({
        method: 'GET',
        url: '/tournament/1/matches'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.matches).toEqual([]);
    });

    it('should return 500 on unexpected error', async () => {
      vi.mocked(mockTournamentService.getMatches).mockRejectedValue(
        new Error('Database error')
      );

      const response = await server.inject({
        method: 'GET',
        url: '/tournament/1/matches'
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal Server Error');
    });
  });

  // ============================================================================
  // GET /tournament/:id/participants - Get Participants
  // ============================================================================

  describe('GET /tournament/:id/participants', () => {
    it('should get tournament participants', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/tournament/1/participants'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.tournamentId).toBe(1);
      expect(body.participantIds).toEqual([101, 102, 103]);
      expect(body.count).toBe(3);
      expect(mockTournamentService.getParticipantIds).toHaveBeenCalledWith(1);
    });

    it('should return 400 for invalid tournament ID', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/tournament/invalid/participants'
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('Invalid tournament ID');
    });

    it('should return empty array when no participants', async () => {
      vi.mocked(mockTournamentService.getParticipantIds).mockResolvedValue([]);

      const response = await server.inject({
        method: 'GET',
        url: '/tournament/1/participants'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.participantIds).toEqual([]);
      expect(body.count).toBe(0);
    });

    it('should return 500 on unexpected error', async () => {
      vi.mocked(mockTournamentService.getParticipantIds).mockRejectedValue(
        new Error('Database error')
      );

      const response = await server.inject({
        method: 'GET',
        url: '/tournament/1/participants'
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal Server Error');
    });
  });
});
