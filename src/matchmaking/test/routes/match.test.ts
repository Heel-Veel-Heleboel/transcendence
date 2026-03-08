import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { registerMatchRoutes } from '../../src/routes/match.js';
import { MatchDao } from '../../src/dao/match.js';
import { TournamentDao } from '../../src/dao/tournament.js';
import { MatchReporting } from '../../src/services/match-reporting.js';
import { GameServerClient } from '../../src/services/game-server-client.js';
import { ChatServiceClient } from '../../src/services/chat-service-client.js';
import { GatewayNotificationClient } from '../../src/services/gateway-notification-client.js';
import { MatchStatus } from '../../generated/prisma/index.js';

describe('Match Routes', () => {
  let server: FastifyInstance;
  let mockMatchDao: MatchDao;
  let mockTournamentDao: TournamentDao;
  let mockMatchReporting: MatchReporting;
  let mockGameServerClient: GameServerClient;
  let mockChatServiceClient: ChatServiceClient;
  let mockGatewayNotificationClient: GatewayNotificationClient;

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
    round: null,
    bracketPosition: null,
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
      completeMatch: vi.fn(),
      cancelMatch: vi.fn(),
      setGameSessionId: vi.fn().mockResolvedValue(undefined),
    } as any;

    mockTournamentDao = {
      findById: vi.fn(),
    } as any;

    mockMatchReporting = {
      reportMatchResult: vi.fn().mockResolvedValue(undefined),
    } as any;

    mockGameServerClient = {
      createRoom: vi.fn().mockResolvedValue('room-abc'),
    } as any;

    mockChatServiceClient = {
      createGameSessionChannel: vi.fn().mockResolvedValue(undefined),
    } as any;

    mockGatewayNotificationClient = {
      notifyUsers: vi.fn(),
    } as any;

    await registerMatchRoutes(
      server,
      mockMatchDao,
      mockTournamentDao,
      mockMatchReporting,
      mockGameServerClient,
      mockChatServiceClient,
      mockGatewayNotificationClient
    );
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
        headers: { 'x-user-id': '100' },
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
        headers: { 'x-user-id': '101' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.bothReady).toBe(false);
    });

    it('should create game room and return roomId when both players acknowledge', async () => {
      const match = createMockMatch({ player1Acknowledged: true });
      const bothAckedMatch = { ...match, player1Acknowledged: true, player2Acknowledged: true };
      (mockMatchDao.findById as any).mockResolvedValue(match);
      (mockMatchDao.acknowledge as any).mockResolvedValue(bothAckedMatch);

      const response = await server.inject({
        method: 'POST',
        url: '/match/match-123/acknowledge',
        headers: { 'x-user-id': '101' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.bothReady).toBe(true);
      expect(body.roomId).toBe('room-abc');
      expect(mockGameServerClient.createRoom).toHaveBeenCalledWith(bothAckedMatch);
      expect(mockMatchDao.setGameSessionId).toHaveBeenCalledWith('match-123', 'room-abc');
    });

    it('should return 401 when x-user-id header is missing', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/match/match-123/acknowledge',
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('x-user-id');
    });

    it('should return 404 when match not found', async () => {
      (mockMatchDao.findById as any).mockResolvedValue(null);

      const response = await server.inject({
        method: 'POST',
        url: '/match/match-123/acknowledge',
        headers: { 'x-user-id': '100' },
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
        headers: { 'x-user-id': '999' },
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
        headers: { 'x-user-id': '100' },
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
          isFinished: true,
          winnerId: 100,
          player1Score: 11,
          player2Score: 5,
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
          isFinished: true,
          winnerId: 100,
          player1Score: 11,
          player2Score: 5
        },
      });

      expect(mockMatchReporting.reportMatchResult).toHaveBeenCalledWith(completedMatch);
    });

    it('should accept result with minimal payload', async () => {
      const match = createMockMatch({ status: MatchStatus.IN_PROGRESS });
      const completedMatch = { ...match, status: MatchStatus.COMPLETED, winnerId: 100 };
      (mockMatchDao.findById as any).mockResolvedValue(match);
      (mockMatchDao.completeMatch as any).mockResolvedValue(completedMatch);

      const response = await server.inject({
        method: 'POST',
        url: '/match/match-123/result',
        payload: {
          isFinished: true,
          winnerId: 100,
          player1Score: 11,
          player2Score: 5
        },
      });

      expect(response.statusCode).toBe(200);
    });

    it('should return 400 when winnerId is missing for finished match', async () => {
      const match = createMockMatch({ status: MatchStatus.IN_PROGRESS });
      (mockMatchDao.findById as any).mockResolvedValue(match);

      const response = await server.inject({
        method: 'POST',
        url: '/match/match-123/result',
        payload: {
          isFinished: true,
          player1Score: 11,
          player2Score: 5
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('winnerId');
    });

    it('should return 400 when scores are missing for finished match', async () => {
      const match = createMockMatch({ status: MatchStatus.IN_PROGRESS });
      (mockMatchDao.findById as any).mockResolvedValue(match);

      const response = await server.inject({
        method: 'POST',
        url: '/match/match-123/result',
        payload: {
          isFinished: true,
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
          isFinished: true,
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
          isFinished: true,
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
          isFinished: true,
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
          isFinished: true,
          winnerId: 100,
          player1Score: 11,
          player2Score: 5
        },
      });

      // Response should still be 200 because matchReporting is fire-and-forget
      expect(response.statusCode).toBe(200);
    });

    it('should cancel match when isFinished is false', async () => {
      const match = createMockMatch({ status: MatchStatus.IN_PROGRESS });
      const cancelledMatch = { ...match, status: MatchStatus.CANCELLED };
      (mockMatchDao.findById as any).mockResolvedValue(match);
      (mockMatchDao.cancelMatch as any).mockResolvedValue(cancelledMatch);

      const response = await server.inject({
        method: 'POST',
        url: '/match/match-123/result',
        payload: {
          isFinished: false,
          player1Score: 3,
          player2Score: 2,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('CANCELLED');
      expect(mockMatchDao.cancelMatch).toHaveBeenCalledWith('match-123', {
        player1Score: 3,
        player2Score: 2,
        resultSource: 'game_service_cancelled',
      });
    });
  });
});
