import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MatchReporting, UserManagementClient } from '../../src/services/match-reporting.js';
import { MatchDao } from '../../src/dao/match.js';
import { Match } from '../../generated/prisma/index.js';

describe('MatchReporting', () => {
  let matchReporting: MatchReporting;
  let mockMatchDao: MatchDao;
  let mockUserManagementClient: UserManagementClient;

  beforeEach(() => {
    mockMatchDao = {
      findByPlayerId: vi.fn(),
    } as any;

    mockUserManagementClient = {
      reportMatchResult: vi.fn().mockResolvedValue(undefined),
    };

    matchReporting = new MatchReporting(
      mockMatchDao,
      mockUserManagementClient,
      undefined
    );
  });

  describe('reportMatchResult', () => {
    it('should report win/loss for completed match', async () => {
      const match: Match = {
        id: 'match-1',
        player1Id: 100,
        player2Id: 101,
        player1Username: 'player1',
        player2Username: 'player2',
        winnerId: 100,
        status: 'COMPLETED',
        gameMode: 'classic',
        tournamentId: null,
        player1Score: 7,
        player2Score: 5,
        scheduledAt: new Date(),
        completedAt: new Date(),
        deadline: null,
        player1Acknowledged: true,
        player2Acknowledged: true,
        startedAt: new Date(),
        gameSessionId: null,
        isGoldenGame: false,
        resultSource: 'game_service',
      };

      await matchReporting.reportMatchResult(match);

      expect(mockUserManagementClient.reportMatchResult).toHaveBeenCalledTimes(2);
      expect(mockUserManagementClient.reportMatchResult).toHaveBeenCalledWith({
        playerId: 100,
        isWinner: true,
      });
      expect(mockUserManagementClient.reportMatchResult).toHaveBeenCalledWith({
        playerId: 101,
        isWinner: false,
      });
    });

    it('should report player2 as winner correctly', async () => {
      const match: Match = {
        id: 'match-1',
        player1Id: 100,
        player2Id: 101,
        player1Username: 'player1',
        player2Username: 'player2',
        winnerId: 101,
        status: 'COMPLETED',
        gameMode: 'classic',
        tournamentId: null,
        player1Score: 3,
        player2Score: 7,
        scheduledAt: new Date(),
        completedAt: new Date(),
        deadline: null,
        player1Acknowledged: true,
        player2Acknowledged: true,
        startedAt: new Date(),
        gameSessionId: null,
        isGoldenGame: false,
        resultSource: 'game_service',
      };

      await matchReporting.reportMatchResult(match);

      expect(mockUserManagementClient.reportMatchResult).toHaveBeenCalledWith({
        playerId: 100,
        isWinner: false,
      });
      expect(mockUserManagementClient.reportMatchResult).toHaveBeenCalledWith({
        playerId: 101,
        isWinner: true,
      });
    });

    it('should skip reporting for casual FORFEITED match', async () => {
      const match: Match = {
        id: 'match-1',
        player1Id: 100,
        player2Id: 101,
        player1Username: 'player1',
        player2Username: 'player2',
        winnerId: 100,
        status: 'FORFEITED',
        gameMode: 'classic',
        tournamentId: null,
        player1Score: 7,
        player2Score: 0,
        scheduledAt: new Date(),
        completedAt: new Date(),
        deadline: null,
        player1Acknowledged: true,
        player2Acknowledged: false,
        startedAt: null,
        gameSessionId: null,
        isGoldenGame: false,
        resultSource: 'ack_forfeit',
      };

      await matchReporting.reportMatchResult(match);

      expect(mockUserManagementClient.reportMatchResult).not.toHaveBeenCalled();
    });

    it('should skip reporting for casual TIMEOUT match', async () => {
      const match: Match = {
        id: 'match-1',
        player1Id: 100,
        player2Id: 101,
        player1Username: 'player1',
        player2Username: 'player2',
        winnerId: null,
        status: 'TIMEOUT',
        gameMode: 'classic',
        tournamentId: null,
        player1Score: null,
        player2Score: null,
        scheduledAt: new Date(),
        completedAt: new Date(),
        deadline: new Date(),
        player1Acknowledged: false,
        player2Acknowledged: false,
        startedAt: null,
        gameSessionId: null,
        isGoldenGame: false,
        resultSource: 'timeout',
      };

      await matchReporting.reportMatchResult(match);

      expect(mockUserManagementClient.reportMatchResult).not.toHaveBeenCalled();
    });

    it('should report tournament FORFEITED match', async () => {
      const match: Match = {
        id: 'match-1',
        player1Id: 100,
        player2Id: 101,
        player1Username: 'player1',
        player2Username: 'player2',
        winnerId: 100,
        status: 'FORFEITED',
        gameMode: 'classic',
        tournamentId: 5,
        player1Score: 7,
        player2Score: 0,
        scheduledAt: new Date(),
        completedAt: new Date(),
        deadline: new Date(),
        player1Acknowledged: true,
        player2Acknowledged: false,
        startedAt: null,
        gameSessionId: null,
        isGoldenGame: false,
        resultSource: 'ack_forfeit',
      };

      await matchReporting.reportMatchResult(match);

      expect(mockUserManagementClient.reportMatchResult).toHaveBeenCalledTimes(2);
      expect(mockUserManagementClient.reportMatchResult).toHaveBeenCalledWith({
        playerId: 100,
        isWinner: true,
      });
      expect(mockUserManagementClient.reportMatchResult).toHaveBeenCalledWith({
        playerId: 101,
        isWinner: false,
      });
    });

    it('should report tournament TIMEOUT match', async () => {
      const match: Match = {
        id: 'match-1',
        player1Id: 100,
        player2Id: 101,
        player1Username: 'player1',
        player2Username: 'player2',
        winnerId: 100,
        status: 'TIMEOUT',
        gameMode: 'classic',
        tournamentId: 5,
        player1Score: 7,
        player2Score: 0,
        scheduledAt: new Date(),
        completedAt: new Date(),
        deadline: new Date(),
        player1Acknowledged: true,
        player2Acknowledged: false,
        startedAt: null,
        gameSessionId: null,
        isGoldenGame: false,
        resultSource: 'timeout',
      };

      await matchReporting.reportMatchResult(match);

      expect(mockUserManagementClient.reportMatchResult).toHaveBeenCalledTimes(2);
    });

    it('should report double forfeit in tournament as both losing', async () => {
      const match: Match = {
        id: 'match-1',
        player1Id: 100,
        player2Id: 101,
        player1Username: 'player1',
        player2Username: 'player2',
        winnerId: null,
        status: 'FORFEITED',
        gameMode: 'classic',
        tournamentId: 5,
        player1Score: 0,
        player2Score: 0,
        scheduledAt: new Date(),
        completedAt: new Date(),
        deadline: new Date(),
        player1Acknowledged: false,
        player2Acknowledged: false,
        startedAt: null,
        gameSessionId: null,
        isGoldenGame: false,
        resultSource: 'ack_forfeit:both_no_ack',
      };

      await matchReporting.reportMatchResult(match);

      expect(mockUserManagementClient.reportMatchResult).toHaveBeenCalledTimes(2);
      expect(mockUserManagementClient.reportMatchResult).toHaveBeenCalledWith({
        playerId: 100,
        isWinner: false,
      });
      expect(mockUserManagementClient.reportMatchResult).toHaveBeenCalledWith({
        playerId: 101,
        isWinner: false,
      });
    });

    it('should skip reporting completed match without winner', async () => {
      const match: Match = {
        id: 'match-1',
        player1Id: 100,
        player2Id: 101,
        player1Username: 'player1',
        player2Username: 'player2',
        winnerId: null,
        status: 'COMPLETED',
        gameMode: 'classic',
        tournamentId: null,
        player1Score: 5,
        player2Score: 5,
        scheduledAt: new Date(),
        completedAt: new Date(),
        deadline: null,
        player1Acknowledged: true,
        player2Acknowledged: true,
        startedAt: new Date(),
        gameSessionId: null,
        isGoldenGame: false,
        resultSource: 'game_service',
      };

      await matchReporting.reportMatchResult(match);

      expect(mockUserManagementClient.reportMatchResult).not.toHaveBeenCalled();
    });

    it('should throw error if user management client fails', async () => {
      const match: Match = {
        id: 'match-1',
        player1Id: 100,
        player2Id: 101,
        player1Username: 'player1',
        player2Username: 'player2',
        winnerId: 100,
        status: 'COMPLETED',
        gameMode: 'classic',
        tournamentId: null,
        player1Score: 7,
        player2Score: 5,
        scheduledAt: new Date(),
        completedAt: new Date(),
        deadline: null,
        player1Acknowledged: true,
        player2Acknowledged: true,
        startedAt: new Date(),
        gameSessionId: null,
        isGoldenGame: false,
        resultSource: 'game_service',
      };

      mockUserManagementClient.reportMatchResult = vi.fn().mockRejectedValue(
        new Error('Service unavailable')
      );

      await expect(matchReporting.reportMatchResult(match)).rejects.toThrow(
        'Service unavailable'
      );
    });
  });

  describe('getMatchHistory', () => {
    const createMatch = (overrides: Partial<Match>): Match => ({
      id: 'match-1',
      player1Id: 100,
      player2Id: 101,
      player1Username: 'player1',
      player2Username: 'player2',
      winnerId: 100,
      status: 'COMPLETED',
      gameMode: 'classic',
      tournamentId: null,
      player1Score: 7,
      player2Score: 5,
      scheduledAt: new Date(),
      completedAt: new Date('2024-01-01T12:00:00Z'),
      deadline: null,
      player1Acknowledged: true,
      player2Acknowledged: true,
      startedAt: new Date(),
      gameSessionId: null,
      isGoldenGame: false,
      resultSource: 'game_service',
      ...overrides,
    });

    it('should return match history for player', async () => {
      const matches = [
        createMatch({
          id: 'match-1',
          player1Id: 100,
          player2Id: 101,
          player1Username: 'me',
          player2Username: 'opponent1',
          winnerId: 100,
          player1Score: 7,
          player2Score: 5,
          completedAt: new Date('2024-01-01T12:00:00Z'),
        }),
      ];

      (mockMatchDao.findByPlayerId as any).mockResolvedValue(matches);

      const history = await matchReporting.getMatchHistory(100);

      expect(history).toHaveLength(1);
      expect(history[0]).toEqual({
        matchId: 'match-1',
        opponentId: 101,
        opponentUsername: 'opponent1',
        isWinner: true,
        userScore: 7,
        opponentScore: 5,
        gameMode: 'classic',
        tournamentId: null,
        completedAt: new Date('2024-01-01T12:00:00Z'),
      });
    });

    it('should return history when player is player2', async () => {
      const matches = [
        createMatch({
          id: 'match-1',
          player1Id: 101,
          player2Id: 100,
          player1Username: 'opponent1',
          player2Username: 'me',
          winnerId: 100,
          player1Score: 3,
          player2Score: 7,
        }),
      ];

      (mockMatchDao.findByPlayerId as any).mockResolvedValue(matches);

      const history = await matchReporting.getMatchHistory(100);

      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        opponentId: 101,
        opponentUsername: 'opponent1',
        isWinner: true,
        userScore: 7,
        opponentScore: 3,
      });
    });

    it('should return loss result when player lost', async () => {
      const matches = [
        createMatch({
          player1Id: 100,
          player2Id: 101,
          winnerId: 101,
          player1Score: 3,
          player2Score: 7,
        }),
      ];

      (mockMatchDao.findByPlayerId as any).mockResolvedValue(matches);

      const history = await matchReporting.getMatchHistory(100);

      expect(history[0].isWinner).toBe(false);
    });

    it('should exclude casual FORFEITED matches', async () => {
      const matches = [
        createMatch({
          id: 'match-1',
          status: 'FORFEITED',
          tournamentId: null,
        }),
      ];

      (mockMatchDao.findByPlayerId as any).mockResolvedValue(matches);

      const history = await matchReporting.getMatchHistory(100);

      expect(history).toHaveLength(0);
    });

    it('should exclude casual TIMEOUT matches', async () => {
      const matches = [
        createMatch({
          id: 'match-1',
          status: 'TIMEOUT',
          tournamentId: null,
        }),
      ];

      (mockMatchDao.findByPlayerId as any).mockResolvedValue(matches);

      const history = await matchReporting.getMatchHistory(100);

      expect(history).toHaveLength(0);
    });

    it('should include tournament FORFEITED matches', async () => {
      const matches = [
        createMatch({
          id: 'match-1',
          status: 'FORFEITED',
          tournamentId: 5,
        }),
      ];

      (mockMatchDao.findByPlayerId as any).mockResolvedValue(matches);

      const history = await matchReporting.getMatchHistory(100);

      expect(history).toHaveLength(1);
      expect(history[0].tournamentId).toBe(5);
    });

    it('should include tournament TIMEOUT matches', async () => {
      const matches = [
        createMatch({
          id: 'match-1',
          status: 'TIMEOUT',
          tournamentId: 5,
        }),
      ];

      (mockMatchDao.findByPlayerId as any).mockResolvedValue(matches);

      const history = await matchReporting.getMatchHistory(100);

      expect(history).toHaveLength(1);
    });

    it('should exclude pending/in-progress matches', async () => {
      const matches = [
        createMatch({ status: 'PENDING_ACKNOWLEDGEMENT' }),
        createMatch({ status: 'SCHEDULED' }),
        createMatch({ status: 'IN_PROGRESS' }),
      ];

      (mockMatchDao.findByPlayerId as any).mockResolvedValue(matches);

      const history = await matchReporting.getMatchHistory(100);

      expect(history).toHaveLength(0);
    });

    it('should exclude matches without completedAt', async () => {
      const matches = [
        createMatch({ completedAt: null }),
      ];

      (mockMatchDao.findByPlayerId as any).mockResolvedValue(matches);

      const history = await matchReporting.getMatchHistory(100);

      expect(history).toHaveLength(0);
    });

    it('should sort by completedAt descending (most recent first)', async () => {
      const matches = [
        createMatch({
          id: 'match-old',
          completedAt: new Date('2024-01-01T10:00:00Z'),
        }),
        createMatch({
          id: 'match-new',
          completedAt: new Date('2024-01-01T14:00:00Z'),
        }),
        createMatch({
          id: 'match-mid',
          completedAt: new Date('2024-01-01T12:00:00Z'),
        }),
      ];

      (mockMatchDao.findByPlayerId as any).mockResolvedValue(matches);

      const history = await matchReporting.getMatchHistory(100);

      expect(history).toHaveLength(3);
      expect(history[0].matchId).toBe('match-new');
      expect(history[1].matchId).toBe('match-mid');
      expect(history[2].matchId).toBe('match-old');
    });

    it('should apply limit when specified', async () => {
      const matches = [
        createMatch({ id: 'match-1', completedAt: new Date('2024-01-03') }),
        createMatch({ id: 'match-2', completedAt: new Date('2024-01-02') }),
        createMatch({ id: 'match-3', completedAt: new Date('2024-01-01') }),
      ];

      (mockMatchDao.findByPlayerId as any).mockResolvedValue(matches);

      const history = await matchReporting.getMatchHistory(100, 2);

      expect(history).toHaveLength(2);
      expect(history[0].matchId).toBe('match-1');
      expect(history[1].matchId).toBe('match-2');
    });

    it('should return empty array when no matches found', async () => {
      (mockMatchDao.findByPlayerId as any).mockResolvedValue([]);

      const history = await matchReporting.getMatchHistory(100);

      expect(history).toEqual([]);
    });

    it('should handle mixed match types correctly', async () => {
      const matches = [
        createMatch({
          id: 'casual-completed',
          status: 'COMPLETED',
          tournamentId: null,
          completedAt: new Date('2024-01-05'),
        }),
        createMatch({
          id: 'casual-forfeited',
          status: 'FORFEITED',
          tournamentId: null,
          completedAt: new Date('2024-01-04'),
        }),
        createMatch({
          id: 'tournament-completed',
          status: 'COMPLETED',
          tournamentId: 5,
          completedAt: new Date('2024-01-03'),
        }),
        createMatch({
          id: 'tournament-forfeited',
          status: 'FORFEITED',
          tournamentId: 5,
          completedAt: new Date('2024-01-02'),
        }),
        createMatch({
          id: 'pending',
          status: 'PENDING_ACKNOWLEDGEMENT',
          tournamentId: null,
          completedAt: null,
        }),
      ];

      (mockMatchDao.findByPlayerId as any).mockResolvedValue(matches);

      const history = await matchReporting.getMatchHistory(100);

      expect(history).toHaveLength(3);
      expect(history.map(h => h.matchId)).toEqual([
        'casual-completed',
        'tournament-completed',
        'tournament-forfeited',
      ]);
    });
  });
});
