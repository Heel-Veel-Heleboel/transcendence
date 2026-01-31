import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { registerMatchRoutes } from '../../../src/matchmaking/src/routes/match.js';
import { MatchDao } from '../../../src/matchmaking/src/dao/match.js';
import { MatchReporting } from '../../../src/matchmaking/src/services/match-reporting.js';
import { MatchStatus } from '../../../src/matchmaking/generated/prisma/index.js';

describe('Match Routes', () => {
  let server: FastifyInstance;
  let mockMatchDao: MatchDao;
  let mockMatchReporting: MatchReporting;

  const createMockMatch = (overrides = {}) => ({
    id: 'match-123',
    player1Id: 100,
    player2Id: 101,
    player1Username: 'player1',
    player2Username: 'player2',
    status: MatchStatus.PENDING_ACKNOWLEDGEMENT,
    player1Acknowledged: false,
    player2Acknowledged: false,
    gameMode: 'classic',
    tournamentId: null,
    winnerId: null,
    player1Score: null,
    player2Score: null,
    gameSessionId: null,
    deadline: null,
    isGoldenGame: false,
    resultSource: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  });

  beforeEach(async () => {
    server = Fastify();

    mockMatchDao = {
      findById: vi.fn(),
      acknowledge: vi.fn(),
      updateStatus: vi.fn(),
      completeMatch: vi.fn(),
    } as any;

    mockMatchReporting = {
      reportMatchResult: vi.fn().mockResolvedValue(undefined),
    } as any;

    await registerMatchRoutes(server, mockMatchDao, mockMatchReporting);
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  describe('POST /match/:matchId/acknowledge', () => {
    it('should acknowledge match successfully for player1', async () => {
      const match = createMockMatch();
      (mockMatchDao.findById as any).mockResolvedValue(match);
      (mockMatchDao.acknowledge as any).mockResolvedValue({
        ...match,
        player1Acknowledged: true
      });

      const response = await server.inject({
        method: 'POST',
        url: '/match/match-123/acknowledge',
        payload: { userId: 100 },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.matchId).toBe('match-123');
      expect(body.bothReady).toBe(false);
      expect(mockMatchDao.acknowledge).toHaveBeenCalledWith('match-123', 100);
    });

    it('should acknowledge match successfully for player2', async () => {
      const match = createMockMatch();
      (mockMatchDao.findById as any).mockResolvedValue(match);
      (mockMatchDao.acknowledge as any).mockResolvedValue({
        ...match,
        player2Acknowledged: true
      });

      const response = await server.inject({
        method: 'POST',
        url: '/match/match-123/acknowledge',
        payload: { userId: 101 },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.bothReady).toBe(false);
    });

    it('should update status to SCHEDULED when both players acknowledge', async () => {
      const match = createMockMatch({ player1Acknowledged: true });
      (mockMatchDao.findById as any).mockResolvedValue(match);
      (mockMatchDao.acknowledge as any).mockResolvedValue({
        ...match,
        player1Acknowledged: true,
        player2Acknowledged: true
      });

      const response = await server.inject({
        method: 'POST',
        url: '/match/match-123/acknowledge',
        payload: { userId: 101 },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.bothReady).toBe(true);
      expect(mockMatchDao.updateStatus).toHaveBeenCalledWith('match-123', MatchStatus.SCHEDULED);
    });

    it('should return 400 when userId is missing', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/match/match-123/acknowledge',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('userId');
    });

    it('should return 404 when match not found', async () => {
      (mockMatchDao.findById as any).mockResolvedValue(null);

      const response = await server.inject({
        method: 'POST',
        url: '/match/match-123/acknowledge',
        payload: { userId: 100 },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Not Found');
    });

    it('should return 403 when user is not a player in the match', async () => {
      const match = createMockMatch();
      (mockMatchDao.findById as any).mockResolvedValue(match);

      const response = await server.inject({
        method: 'POST',
        url: '/match/match-123/acknowledge',
        payload: { userId: 999 },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Forbidden');
      expect(body.message).toContain('not a player');
    });

    it('should return 500 on DAO error', async () => {
      (mockMatchDao.findById as any).mockRejectedValue(new Error('DB error'));

      const response = await server.inject({
        method: 'POST',
        url: '/match/match-123/acknowledge',
        payload: { userId: 100 },
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal Server Error');
    });
  });

  describe('GET /match/:matchId', () => {
    it('should return match details', async () => {
      const match = createMockMatch();
      (mockMatchDao.findById as any).mockResolvedValue(match);

      const response = await server.inject({
        method: 'GET',
        url: '/match/match-123',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('match-123');
      expect(body.player1Id).toBe(100);
      expect(body.player2Id).toBe(101);
    });

    it('should return 404 when match not found', async () => {
      (mockMatchDao.findById as any).mockResolvedValue(null);

      const response = await server.inject({
        method: 'GET',
        url: '/match/match-123',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Not Found');
    });

    it('should return 500 on DAO error', async () => {
      (mockMatchDao.findById as any).mockRejectedValue(new Error('DB error'));

      const response = await server.inject({
        method: 'GET',
        url: '/match/match-123',
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal Server Error');
    });
  });

  describe('POST /match/:matchId/result', () => {
    it('should record match result successfully', async () => {
      const match = createMockMatch({ status: MatchStatus.IN_PROGRESS });
      const completedMatch = {
        ...match,
        status: MatchStatus.COMPLETED,
        winnerId: 100,
        player1Score: 11,
        player2Score: 5,
        completedAt: new Date()
      };
      (mockMatchDao.findById as any).mockResolvedValue(match);
      (mockMatchDao.completeMatch as any).mockResolvedValue(completedMatch);

      const response = await server.inject({
        method: 'POST',
        url: '/match/match-123/result',
        payload: {
          winnerId: 100,
          player1Score: 11,
          player2Score: 5,
          gameSessionId: 'game-session-1'
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.matchId).toBe('match-123');
      expect(mockMatchDao.completeMatch).toHaveBeenCalledWith('match-123', {
        winnerId: 100,
        player1Score: 11,
        player2Score: 5,
        gameSessionId: 'game-session-1',
        resultSource: 'game_service'
      });
    });

    it('should report result to user management after recording', async () => {
      const match = createMockMatch({ status: MatchStatus.IN_PROGRESS });
      const completedMatch = {
        ...match,
        status: MatchStatus.COMPLETED,
        winnerId: 100,
        player1Score: 11,
        player2Score: 5,
        completedAt: new Date()
      };
      (mockMatchDao.findById as any).mockResolvedValue(match);
      (mockMatchDao.completeMatch as any).mockResolvedValue(completedMatch);

      await server.inject({
        method: 'POST',
        url: '/match/match-123/result',
        payload: {
          winnerId: 100,
          player1Score: 11,
          player2Score: 5
        },
      });

      expect(mockMatchReporting.reportMatchResult).toHaveBeenCalledWith(completedMatch);
    });

    it('should accept result without gameSessionId', async () => {
      const match = createMockMatch({ status: MatchStatus.IN_PROGRESS });
      const completedMatch = { ...match, status: MatchStatus.COMPLETED, winnerId: 100 };
      (mockMatchDao.findById as any).mockResolvedValue(match);
      (mockMatchDao.completeMatch as any).mockResolvedValue(completedMatch);

      const response = await server.inject({
        method: 'POST',
        url: '/match/match-123/result',
        payload: {
          winnerId: 100,
          player1Score: 11,
          player2Score: 5
        },
      });

      expect(response.statusCode).toBe(200);
    });

    it('should return 400 when winnerId is missing', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/match/match-123/result',
        payload: {
          player1Score: 11,
          player2Score: 5
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('winnerId');
    });

    it('should return 400 when scores are missing', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/match/match-123/result',
        payload: {
          winnerId: 100
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('player1Score');
    });

    it('should return 404 when match not found', async () => {
      (mockMatchDao.findById as any).mockResolvedValue(null);

      const response = await server.inject({
        method: 'POST',
        url: '/match/match-123/result',
        payload: {
          winnerId: 100,
          player1Score: 11,
          player2Score: 5
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Not Found');
    });

    it('should return 400 when winnerId is not a player', async () => {
      const match = createMockMatch({ status: MatchStatus.IN_PROGRESS });
      (mockMatchDao.findById as any).mockResolvedValue(match);

      const response = await server.inject({
        method: 'POST',
        url: '/match/match-123/result',
        payload: {
          winnerId: 999,
          player1Score: 11,
          player2Score: 5
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('Invalid winnerId');
    });

    it('should return 500 on DAO error', async () => {
      (mockMatchDao.findById as any).mockRejectedValue(new Error('DB error'));

      const response = await server.inject({
        method: 'POST',
        url: '/match/match-123/result',
        payload: {
          winnerId: 100,
          player1Score: 11,
          player2Score: 5
        },
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal Server Error');
    });

    it('should still succeed even if matchReporting fails', async () => {
      const match = createMockMatch({ status: MatchStatus.IN_PROGRESS });
      const completedMatch = { ...match, status: MatchStatus.COMPLETED, winnerId: 100 };
      (mockMatchDao.findById as any).mockResolvedValue(match);
      (mockMatchDao.completeMatch as any).mockResolvedValue(completedMatch);
      (mockMatchReporting.reportMatchResult as any).mockRejectedValue(new Error('Network error'));

      const response = await server.inject({
        method: 'POST',
        url: '/match/match-123/result',
        payload: {
          winnerId: 100,
          player1Score: 11,
          player2Score: 5
        },
      });

      // Response should still be 200 because matchReporting is fire-and-forget
      expect(response.statusCode).toBe(200);
    });
  });
});
