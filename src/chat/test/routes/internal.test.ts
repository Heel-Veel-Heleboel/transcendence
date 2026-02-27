import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { registerInternalRoutes } from '../../src/routes/internal.js';

describe('Internal Routes', () => {
  let server: FastifyInstance;
  let mockChatService: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    server = Fastify();
    mockChatService = {
      sendMatchAck: vi.fn(),
      createGameSessionChannel: vi.fn(),
      createTournamentChannel: vi.fn(),
      sendSystemMessage: vi.fn(),
    };

    await registerInternalRoutes(server, mockChatService as any);
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  // ── POST /chat/internal/match-ack ───────────────────────

  describe('POST /chat/internal/match-ack', () => {
    it('should create match ack channel and messages', async () => {
      const mockResult = {
        channel: { id: 'gs-1' },
        messages: [{ id: 'ack-1' }, { id: 'ack-2' }],
      };
      mockChatService.sendMatchAck.mockResolvedValueOnce(mockResult);

      const response = await server.inject({
        method: 'POST',
        url: '/chat/internal/match-ack',
        payload: {
          matchId: 'match-1',
          playerIds: [1, 2],
          gameMode: 'classic',
          expiresAt: '2026-01-01T12:05:00Z',
        },
      });

      expect(response.statusCode).toBe(201);
      expect(mockChatService.sendMatchAck).toBeCalledWith(
        'match-1', [1, 2], 'classic', '2026-01-01T12:05:00Z'
      );
    });

    it('should return 400 for missing fields', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/chat/internal/match-ack',
        payload: { matchId: 'match-1' },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  // ── POST /chat/internal/channels/game-session ───────────

  describe('POST /chat/internal/channels/game-session', () => {
    it('should create a game session channel', async () => {
      const mockChannel = { id: 'gs-1', type: 'GAME_SESSION' };
      mockChatService.createGameSessionChannel.mockResolvedValueOnce(mockChannel);

      const response = await server.inject({
        method: 'POST',
        url: '/chat/internal/channels/game-session',
        payload: { playerIds: [1, 2], gameSessionId: 'game-abc' },
      });

      expect(response.statusCode).toBe(201);
      expect(mockChatService.createGameSessionChannel).toBeCalledWith([1, 2], 'game-abc');
    });

    it('should return 400 without playerIds', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/chat/internal/channels/game-session',
        payload: { gameSessionId: 'game-abc' },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  // ── POST /chat/internal/channels/tournament ─────────────

  describe('POST /chat/internal/channels/tournament', () => {
    it('should create a tournament channel', async () => {
      const mockChannel = { id: 'tourn-1', type: 'TOURNAMENT' };
      mockChatService.createTournamentChannel.mockResolvedValueOnce(mockChannel);

      const response = await server.inject({
        method: 'POST',
        url: '/chat/internal/channels/tournament',
        payload: { userId: 1, tournamentId: 10, tournamentName: 'Spring Cup' },
      });

      expect(response.statusCode).toBe(201);
      expect(mockChatService.createTournamentChannel).toBeCalledWith(1, 10, 'Spring Cup');
    });

    it('should return 400 for missing fields', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/chat/internal/channels/tournament',
        payload: { userId: 1 },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  // ── POST /chat/internal/channels/:channelId/system-message

  describe('POST /chat/internal/channels/:channelId/system-message', () => {
    it('should send a system message', async () => {
      const mockMessage = { id: 'sys-1', type: 'SYSTEM', content: 'Next match starting!' };
      mockChatService.sendSystemMessage.mockResolvedValueOnce(mockMessage);

      const response = await server.inject({
        method: 'POST',
        url: '/chat/internal/channels/ch-1/system-message',
        payload: { content: 'Next match starting!' },
      });

      expect(response.statusCode).toBe(201);
      expect(mockChatService.sendSystemMessage).toBeCalledWith('ch-1', 'Next match starting!');
    });

    it('should return 400 without content', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/chat/internal/channels/ch-1/system-message',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
