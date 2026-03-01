import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { registerMatchmakingRoutes } from '../../src/routes/matchmaking.js';
import { MatchmakingService } from '../../src/services/casual-matchmaking.js';
import { PoolRegistry } from '../../src/services/pool-registry.js';
import { ChatServiceClient } from '../../src/services/chat-service-client.js';
import { GameMode } from '../../src/types/match.js';

describe('Matchmaking Routes', () => {
  let server: FastifyInstance;
  let mockClassicPool: MatchmakingService;
  let mockPowerupPool: MatchmakingService;
  let poolRegistry: PoolRegistry;
  let pools: Record<GameMode, MatchmakingService>;
  let mockChatServiceClient: ChatServiceClient;

  beforeEach(async () => {
    server = Fastify();

    mockClassicPool = {
      joinPool: vi.fn().mockReturnValue({ success: true, queuePosition: 1 }),
      leavePool: vi.fn().mockReturnValue({ success: true }),
      getPoolSize: vi.fn().mockReturnValue(1),
      canFormPair: vi.fn().mockReturnValue(false),
      tryAutoPair: vi.fn().mockResolvedValue({ paired: false }),
    } as any;

    mockPowerupPool = {
      joinPool: vi.fn().mockReturnValue({ success: true, queuePosition: 1 }),
      leavePool: vi.fn().mockReturnValue({ success: true }),
      getPoolSize: vi.fn().mockReturnValue(1),
      canFormPair: vi.fn().mockReturnValue(false),
      tryAutoPair: vi.fn().mockResolvedValue({ paired: false }),
    } as any;

    poolRegistry = new PoolRegistry();

    pools = {
      classic: mockClassicPool,
      powerup: mockPowerupPool,
    };

    mockChatServiceClient = {
      sendMatchAck: vi.fn().mockResolvedValue(undefined),
      createGameSessionChannel: vi.fn().mockResolvedValue(undefined),
    } as any;

    await registerMatchmakingRoutes(server, pools, poolRegistry, mockChatServiceClient);
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  describe('POST /matchmaking/:gameMode/join', () => {
    it('should join classic pool successfully', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/matchmaking/classic/join',
        headers: { 'x-user-id': '100', 'x-user-name': 'player1' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.gameMode).toBe('classic');
      expect(body.message).toContain('classic');
      expect(mockClassicPool.joinPool).toHaveBeenCalledWith(100, 'player1');
    });

    it('should join powerup pool successfully', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/matchmaking/powerup/join',
        headers: { 'x-user-id': '100', 'x-user-name': 'player1' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.gameMode).toBe('powerup');
      expect(mockPowerupPool.joinPool).toHaveBeenCalledWith(100, 'player1');
    });

    it('should return 400 for invalid gameMode', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/matchmaking/invalid/join',
        headers: { 'x-user-id': '100', 'x-user-name': 'player1' },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('Invalid gameMode');
    });

    it('should return 401 when x-user-id header is missing', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/matchmaking/classic/join',
        headers: { 'x-user-name': 'player1' },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('x-user-id');
    });

    it('should return 401 when x-user-name header is missing', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/matchmaking/classic/join',
        headers: { 'x-user-id': '100' },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('x-user-name');
    });

    it('should return 409 when user tries to join different pool', async () => {
      // First join classic
      await server.inject({
        method: 'POST',
        url: '/matchmaking/classic/join',
        headers: { 'x-user-id': '100', 'x-user-name': 'player1' },
      });

      // Try to join powerup
      const response = await server.inject({
        method: 'POST',
        url: '/matchmaking/powerup/join',
        headers: { 'x-user-id': '100', 'x-user-name': 'player1' },
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Conflict');
      expect(body.message).toContain('Already in classic queue');
      expect(body.currentPool).toBe('classic');
    });

    it('should allow rejoining same pool (idempotent)', async () => {
      // First join classic
      await server.inject({
        method: 'POST',
        url: '/matchmaking/classic/join',
        headers: { 'x-user-id': '100', 'x-user-name': 'player1' },
      });

      // Mock that user is already in pool
      (mockClassicPool.joinPool as any).mockReturnValue({ success: false, queuePosition: 1 });

      // Try to join classic again
      const response = await server.inject({
        method: 'POST',
        url: '/matchmaking/classic/join',
        headers: { 'x-user-id': '100', 'x-user-name': 'player1' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Already in pool');
    });

    it('should register user in pool registry on successful join', async () => {
      await server.inject({
        method: 'POST',
        url: '/matchmaking/classic/join',
        headers: { 'x-user-id': '100', 'x-user-name': 'player1' },
      });

      expect(poolRegistry.getCurrentPool(100)).toBe('classic');
    });

    it('should not register user in pool registry on failed join', async () => {
      (mockClassicPool.joinPool as any).mockReturnValue({ success: false, queuePosition: -1 });

      await server.inject({
        method: 'POST',
        url: '/matchmaking/classic/join',
        headers: { 'x-user-id': '100', 'x-user-name': 'player1' },
      });

      expect(poolRegistry.getCurrentPool(100)).toBeUndefined();
    });

    it('should return 500 on service error', async () => {
      (mockClassicPool.joinPool as any).mockImplementation(() => { throw new Error('DB error'); });

      const response = await server.inject({
        method: 'POST',
        url: '/matchmaking/classic/join',
        headers: { 'x-user-id': '100', 'x-user-name': 'player1' },
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal Server Error');
    });
  });

  describe('POST /matchmaking/:gameMode/leave', () => {
    it('should leave classic pool successfully', async () => {
      // First join
      await server.inject({
        method: 'POST',
        url: '/matchmaking/classic/join',
        headers: { 'x-user-id': '100', 'x-user-name': 'player1' },
      });

      // Then leave
      const response = await server.inject({
        method: 'POST',
        url: '/matchmaking/classic/leave',
        headers: { 'x-user-id': '100' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.gameMode).toBe('classic');
      expect(body.message).toContain('left');
      expect(mockClassicPool.leavePool).toHaveBeenCalledWith(100);
    });

    it('should leave powerup pool successfully', async () => {
      // First join
      await server.inject({
        method: 'POST',
        url: '/matchmaking/powerup/join',
        headers: { 'x-user-id': '100', 'x-user-name': 'player1' },
      });

      // Then leave
      const response = await server.inject({
        method: 'POST',
        url: '/matchmaking/powerup/leave',
        headers: { 'x-user-id': '100' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.gameMode).toBe('powerup');
      expect(mockPowerupPool.leavePool).toHaveBeenCalledWith(100);
    });

    it('should return 400 for invalid gameMode', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/matchmaking/invalid/leave',
        headers: { 'x-user-id': '100' },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('Invalid gameMode');
    });

    it('should return 401 when x-user-id header is missing', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/matchmaking/classic/leave',
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('x-user-id');
    });

    it('should return 400 when trying to leave wrong pool', async () => {
      // Join classic
      await server.inject({
        method: 'POST',
        url: '/matchmaking/classic/join',
        headers: { 'x-user-id': '100', 'x-user-name': 'player1' },
      });

      // Try to leave powerup
      const response = await server.inject({
        method: 'POST',
        url: '/matchmaking/powerup/leave',
        headers: { 'x-user-id': '100' },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('Not in powerup queue');
      expect(body.currentPool).toBe('classic');
    });

    it('should unregister user from pool registry on successful leave', async () => {
      // Join first
      await server.inject({
        method: 'POST',
        url: '/matchmaking/classic/join',
        headers: { 'x-user-id': '100', 'x-user-name': 'player1' },
      });

      expect(poolRegistry.getCurrentPool(100)).toBe('classic');

      // Leave
      await server.inject({
        method: 'POST',
        url: '/matchmaking/classic/leave',
        headers: { 'x-user-id': '100' },
      });

      expect(poolRegistry.getCurrentPool(100)).toBeUndefined();
    });

    it('should not unregister user from pool registry on failed leave', async () => {
      // Join first
      await server.inject({
        method: 'POST',
        url: '/matchmaking/classic/join',
        headers: { 'x-user-id': '100', 'x-user-name': 'player1' },
      });

      (mockClassicPool.leavePool as any).mockReturnValue({ success: false });

      // Try to leave
      await server.inject({
        method: 'POST',
        url: '/matchmaking/classic/leave',
        headers: { 'x-user-id': '100' },
      });

      expect(poolRegistry.getCurrentPool(100)).toBe('classic');
    });

    it('should return 500 on service error', async () => {
      // Join first
      await server.inject({
        method: 'POST',
        url: '/matchmaking/classic/join',
        headers: { 'x-user-id': '100', 'x-user-name': 'player1' },
      });

      (mockClassicPool.leavePool as any).mockImplementation(() => { throw new Error('DB error'); });

      const response = await server.inject({
        method: 'POST',
        url: '/matchmaking/classic/leave',
        headers: { 'x-user-id': '100' },
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal Server Error');
    });

    it('should allow user to leave and join different pool', async () => {
      // Join classic
      await server.inject({
        method: 'POST',
        url: '/matchmaking/classic/join',
        headers: { 'x-user-id': '100', 'x-user-name': 'player1' },
      });

      // Leave classic
      await server.inject({
        method: 'POST',
        url: '/matchmaking/classic/leave',
        headers: { 'x-user-id': '100' },
      });

      // Join powerup
      const response = await server.inject({
        method: 'POST',
        url: '/matchmaking/powerup/join',
        headers: { 'x-user-id': '100', 'x-user-name': 'player1' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.gameMode).toBe('powerup');
      expect(poolRegistry.getCurrentPool(100)).toBe('powerup');
    });
  });

  describe('Multiple users scenario', () => {
    it('should allow different users in different pools', async () => {
      // User 100 joins classic
      const response1 = await server.inject({
        method: 'POST',
        url: '/matchmaking/classic/join',
        headers: { 'x-user-id': '100', 'x-user-name': 'player1' },
      });

      // User 101 joins powerup
      const response2 = await server.inject({
        method: 'POST',
        url: '/matchmaking/powerup/join',
        headers: { 'x-user-id': '101', 'x-user-name': 'player2' },
      });

      expect(response1.statusCode).toBe(200);
      expect(response2.statusCode).toBe(200);
      expect(poolRegistry.getCurrentPool(100)).toBe('classic');
      expect(poolRegistry.getCurrentPool(101)).toBe('powerup');
    });

    it('should allow different users in same pool', async () => {
      // User 100 joins classic
      const response1 = await server.inject({
        method: 'POST',
        url: '/matchmaking/classic/join',
        headers: { 'x-user-id': '100', 'x-user-name': 'player1' },
      });

      // User 101 joins classic
      const response2 = await server.inject({
        method: 'POST',
        url: '/matchmaking/classic/join',
        headers: { 'x-user-id': '101', 'x-user-name': 'player2' },
      });

      expect(response1.statusCode).toBe(200);
      expect(response2.statusCode).toBe(200);
      expect(poolRegistry.getCurrentPool(100)).toBe('classic');
      expect(poolRegistry.getCurrentPool(101)).toBe('classic');
    });
  });
});
