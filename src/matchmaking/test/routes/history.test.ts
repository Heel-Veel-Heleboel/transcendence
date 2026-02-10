import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { registerHistoryRoutes } from '../../src/routes/history.js';
import { MatchReporting } from '../../src/services/match-reporting.js';
import { MatchHistoryEntry } from '../../src/types/match.js';

describe('History Routes', () => {
  let server: FastifyInstance;
  let mockMatchReporting: MatchReporting;

  const createMockHistoryEntry = (overrides = {}): MatchHistoryEntry => ({
    matchId: 'match-123',
    opponentId: 101,
    opponentUsername: 'opponent1',
    result: 'W',
    userScore: 11,
    opponentScore: 5,
    gameMode: 'classic',
    tournamentId: null,
    completedAt: new Date('2024-01-15T10:00:00Z'),
    ...overrides
  });

  beforeEach(async () => {
    server = Fastify();

    mockMatchReporting = {
      getMatchHistory: vi.fn(),
    } as any;

    await registerHistoryRoutes(server, mockMatchReporting);
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  describe('GET /players/:userId/history', () => {
    it('should return match history for a user', async () => {
      const history: MatchHistoryEntry[] = [
        createMockHistoryEntry({ matchId: 'match-1', result: 'W' }),
        createMockHistoryEntry({ matchId: 'match-2', result: 'L', opponentId: 102 }),
      ];
      (mockMatchReporting.getMatchHistory as any).mockResolvedValue(history);

      const response = await server.inject({
        method: 'GET',
        url: '/players/100/history',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.userId).toBe(100);
      expect(body.matches).toHaveLength(2);
      expect(body.count).toBe(2);
      expect(mockMatchReporting.getMatchHistory).toHaveBeenCalledWith(100, undefined);
    });

    it('should return empty history for user with no matches', async () => {
      (mockMatchReporting.getMatchHistory as any).mockResolvedValue([]);

      const response = await server.inject({
        method: 'GET',
        url: '/players/100/history',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.userId).toBe(100);
      expect(body.matches).toHaveLength(0);
      expect(body.count).toBe(0);
    });

    it('should pass limit parameter when provided', async () => {
      (mockMatchReporting.getMatchHistory as any).mockResolvedValue([
        createMockHistoryEntry()
      ]);

      const response = await server.inject({
        method: 'GET',
        url: '/players/100/history?limit=5',
      });

      expect(response.statusCode).toBe(200);
      expect(mockMatchReporting.getMatchHistory).toHaveBeenCalledWith(100, 5);
    });

    it('should return 400 for invalid userId', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/players/invalid/history',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('Invalid userId');
    });

    it('should return 400 for invalid limit parameter', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/players/100/history?limit=abc',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('limit');
    });

    it('should return 400 for negative limit parameter', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/players/100/history?limit=-1',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('limit');
    });

    it('should return 400 for zero limit parameter', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/players/100/history?limit=0',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('limit');
    });

    it('should return 500 on service error', async () => {
      (mockMatchReporting.getMatchHistory as any).mockRejectedValue(new Error('DB error'));

      const response = await server.inject({
        method: 'GET',
        url: '/players/100/history',
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal Server Error');
    });

    it('should include tournament matches in history', async () => {
      const history: MatchHistoryEntry[] = [
        createMockHistoryEntry({ matchId: 'match-1', tournamentId: null }),
        createMockHistoryEntry({ matchId: 'match-2', tournamentId: 5 }),
      ];
      (mockMatchReporting.getMatchHistory as any).mockResolvedValue(history);

      const response = await server.inject({
        method: 'GET',
        url: '/players/100/history',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.matches[0].tournamentId).toBeNull();
      expect(body.matches[1].tournamentId).toBe(5);
    });

    it('should return correct game mode in history', async () => {
      const history: MatchHistoryEntry[] = [
        createMockHistoryEntry({ matchId: 'match-1', gameMode: 'classic' }),
        createMockHistoryEntry({ matchId: 'match-2', gameMode: 'powerup' }),
      ];
      (mockMatchReporting.getMatchHistory as any).mockResolvedValue(history);

      const response = await server.inject({
        method: 'GET',
        url: '/players/100/history',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.matches[0].gameMode).toBe('classic');
      expect(body.matches[1].gameMode).toBe('powerup');
    });
  });
});
