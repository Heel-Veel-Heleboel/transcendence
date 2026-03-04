import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { registerInternalRoutes } from '../../src/routes/internal.js';
import { MatchDao } from '../../src/dao/match.js';
import { ChatServiceClient } from '../../src/services/chat-service-client.js';
import { MatchmakingService } from '../../src/services/casual-matchmaking.js';
import { PoolRegistry } from '../../src/services/pool-registry.js';
import { MatchStatus } from '../../generated/prisma/index.js';

describe('Internal Routes', () => {
  let server: FastifyInstance;
  let mockMatchDao: MatchDao;
  let mockChatServiceClient: ChatServiceClient;
  let mockPools: Record<string, MatchmakingService>;
  let mockPoolRegistry: PoolRegistry;

  const createMockMatch = (overrides = {}) => ({
    id: 'match-abc',
    player1Id: 1,
    player2Id: 2,
    player1Username: 'user_1',
    player2Username: 'user_2',
    status: MatchStatus.PENDING_ACKNOWLEDGEMENT,
    player1Acknowledged: false,
    player2Acknowledged: false,
    gameMode: 'classic',
    tournamentId: null,
    winnerId: null,
    player1Score: null,
    player2Score: null,
    gameSessionId: null,
    deadline: new Date(Date.now() + 5 * 60 * 1000),
    isGoldenGame: false,
    resultSource: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    scheduledAt: new Date(),
    ...overrides
  });

  beforeEach(async () => {
    server = Fastify();

    mockMatchDao = {
      create: vi.fn(),
    } as any;

    mockChatServiceClient = {
      sendMatchAck: vi.fn().mockResolvedValue(undefined),
    } as any;

    mockPools = {
      classic: { leavePool: vi.fn().mockReturnValue({ success: true }) } as any,
      powerup: { leavePool: vi.fn().mockReturnValue({ success: true }) } as any,
    };

    mockPoolRegistry = {
      getCurrentPool: vi.fn().mockReturnValue(undefined),
      unregisterUser: vi.fn(),
    } as any;

    await registerInternalRoutes(server, mockMatchDao, mockChatServiceClient, mockPools as any, mockPoolRegistry);
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  // ── POST /matchmaking/internal/direct-match ─────────────────────────────

  describe('POST /matchmaking/internal/direct-match', () => {
    it('should create a direct match and send match-ack', async () => {
      const match = createMockMatch();
      (mockMatchDao.create as any).mockResolvedValue(match);

      const response = await server.inject({
        method: 'POST',
        url: '/matchmaking/internal/direct-match',
        payload: { playerIds: [1, 2], gameMode: 'classic' },
      });

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual({ matchId: 'match-abc' });

      expect(mockMatchDao.create).toBeCalledWith(expect.objectContaining({
        player1Id: 1,
        player2Id: 2,
        gameMode: 'classic',
      }));
      expect(mockChatServiceClient.sendMatchAck).toBeCalledWith(
        'match-abc',
        [1, 2],
        'classic',
        expect.any(Date)
      );
    });

    it('should work with powerup game mode', async () => {
      const match = createMockMatch({ gameMode: 'powerup' });
      (mockMatchDao.create as any).mockResolvedValue(match);

      const response = await server.inject({
        method: 'POST',
        url: '/matchmaking/internal/direct-match',
        payload: { playerIds: [10, 20], gameMode: 'powerup' },
      });

      expect(response.statusCode).toBe(201);
      expect(mockMatchDao.create).toBeCalledWith(expect.objectContaining({
        player1Id: 10,
        player2Id: 20,
        gameMode: 'powerup',
      }));
    });

    it('should remove both players from their pool when they are queued', async () => {
      const match = createMockMatch();
      (mockMatchDao.create as any).mockResolvedValue(match);
      // Both players are in the classic pool
      (mockPoolRegistry.getCurrentPool as any)
        .mockReturnValueOnce('classic')  // player 1
        .mockReturnValueOnce('classic'); // player 2

      await server.inject({
        method: 'POST',
        url: '/matchmaking/internal/direct-match',
        payload: { playerIds: [1, 2], gameMode: 'classic' },
      });

      expect(mockPools.classic.leavePool).toBeCalledTimes(2);
      expect(mockPools.classic.leavePool).toBeCalledWith(1);
      expect(mockPools.classic.leavePool).toBeCalledWith(2);
      expect(mockPoolRegistry.unregisterUser).toBeCalledWith(1);
      expect(mockPoolRegistry.unregisterUser).toBeCalledWith(2);
    });

    it('should remove only the queued player when one is in the pool', async () => {
      const match = createMockMatch();
      (mockMatchDao.create as any).mockResolvedValue(match);
      (mockPoolRegistry.getCurrentPool as any)
        .mockReturnValueOnce('powerup') // player 1 is in powerup pool
        .mockReturnValueOnce(undefined); // player 2 is not queued

      await server.inject({
        method: 'POST',
        url: '/matchmaking/internal/direct-match',
        payload: { playerIds: [1, 2], gameMode: 'classic' },
      });

      expect(mockPools.powerup.leavePool).toBeCalledWith(1);
      expect(mockPoolRegistry.unregisterUser).toBeCalledWith(1);
      expect(mockPoolRegistry.unregisterUser).not.toBeCalledWith(2);
    });

    it('should not touch pools when neither player is queued', async () => {
      const match = createMockMatch();
      (mockMatchDao.create as any).mockResolvedValue(match);
      // Both return undefined (not in any pool)

      await server.inject({
        method: 'POST',
        url: '/matchmaking/internal/direct-match',
        payload: { playerIds: [1, 2], gameMode: 'classic' },
      });

      expect(mockPools.classic.leavePool).not.toBeCalled();
      expect(mockPools.powerup.leavePool).not.toBeCalled();
      expect(mockPoolRegistry.unregisterUser).not.toBeCalled();
    });

    it('should return 201 even when sendMatchAck fails (fire-and-forget)', async () => {
      const match = createMockMatch();
      (mockMatchDao.create as any).mockResolvedValue(match);
      (mockChatServiceClient.sendMatchAck as any).mockRejectedValue(new Error('Chat service down'));

      const response = await server.inject({
        method: 'POST',
        url: '/matchmaking/internal/direct-match',
        payload: { playerIds: [1, 2], gameMode: 'classic' },
      });

      expect(response.statusCode).toBe(201);
    });

    it('should return 400 for invalid gameMode', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/matchmaking/internal/direct-match',
        payload: { playerIds: [1, 2], gameMode: 'invalid' },
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error).toContain('gameMode');
    });

    it('should return 400 when playerIds has only one element', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/matchmaking/internal/direct-match',
        payload: { playerIds: [1], gameMode: 'classic' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when playerIds contains strings', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/matchmaking/internal/direct-match',
        payload: { playerIds: ['1', '2'], gameMode: 'classic' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when both playerIds are the same', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/matchmaking/internal/direct-match',
        payload: { playerIds: [5, 5], gameMode: 'classic' },
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error).toContain('different players');
    });

    it('should return 400 when playerIds is missing', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/matchmaking/internal/direct-match',
        payload: { gameMode: 'classic' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when gameMode is missing', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/matchmaking/internal/direct-match',
        payload: { playerIds: [1, 2] },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 500 when match creation fails', async () => {
      (mockMatchDao.create as any).mockRejectedValue(new Error('DB error'));

      const response = await server.inject({
        method: 'POST',
        url: '/matchmaking/internal/direct-match',
        payload: { playerIds: [1, 2], gameMode: 'classic' },
      });

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body).error).toBe('Internal Server Error');
    });
  });
});
