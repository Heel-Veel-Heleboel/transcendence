import { MatchDao } from '../../src/dao/match.js';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockPrismaClient = {
  match: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
};

describe('MatchDao', () => {
  let dao: MatchDao;

  beforeEach(() => {
    vi.clearAllMocks();
    dao = new MatchDao(mockPrismaClient as any);
  });

  describe('create', () => {
    it('should create a casual match with PENDING_ACKNOWLEDGEMENT status', async () => {
      const deadline = new Date('2026-01-01T12:00:00Z');
      const mockMatch = {
        id: 'match-uuid',
        player1Id: 100,
        player2Id: 101,
        player1Username: 'user100',
        player2Username: 'user101',
        tournamentId: null,
        status: 'PENDING_ACKNOWLEDGEMENT',
        scheduledAt: new Date(),
        deadline,
        player1Acknowledged: false,
        player2Acknowledged: false,
      };
      mockPrismaClient.match.create.mockResolvedValueOnce(mockMatch);

      const result = await dao.create({
        player1Id: 100,
        player2Id: 101,
        player1Username: 'user100',
        player2Username: 'user101',
        deadline,
      });

      expect(mockPrismaClient.match.create).toBeCalledWith({
        data: {
          player1Id: 100,
          player2Id: 101,
          player1Username: 'user100',
          player2Username: 'user101',
          gameMode: 'classic',
          tournamentId: null,
          deadline,
          round: null,
          bracketPosition: null,
          status: 'PENDING_ACKNOWLEDGEMENT',
          scheduledAt: expect.any(Date),
        },
      });
      expect(result).toEqual(mockMatch);
    });

    it('should create a tournament match with round and bracketPosition', async () => {
      const deadline = new Date('2026-01-01T12:00:00Z');
      const mockMatch = {
        id: 'match-uuid',
        player1Id: 100,
        player2Id: 101,
        tournamentId: 5,
        round: 1,
        bracketPosition: 0,
        status: 'PENDING_ACKNOWLEDGEMENT',
        deadline,
      };
      mockPrismaClient.match.create.mockResolvedValueOnce(mockMatch);

      const result = await dao.create({
        player1Id: 100,
        player2Id: 101,
        player1Username: 'user100',
        player2Username: 'user101',
        tournamentId: 5,
        deadline,
        round: 1,
        bracketPosition: 0,
      });

      expect(mockPrismaClient.match.create).toBeCalledWith({
        data: {
          player1Id: 100,
          player2Id: 101,
          player1Username: 'user100',
          player2Username: 'user101',
          gameMode: 'classic',
          tournamentId: 5,
          deadline,
          round: 1,
          bracketPosition: 0,
          status: 'PENDING_ACKNOWLEDGEMENT',
          scheduledAt: expect.any(Date),
        },
      });
      expect(result).toEqual(mockMatch);
    });
  });

  describe('findById', () => {
    it('should find a match by ID', async () => {
      const mockMatch = {
        id: 'match-uuid',
        player1Id: 100,
        player2Id: 101,
        status: 'SCHEDULED',
      };
      mockPrismaClient.match.findUnique.mockResolvedValueOnce(mockMatch);

      const result = await dao.findById('match-uuid');

      expect(mockPrismaClient.match.findUnique).toBeCalledWith({
        where: { id: 'match-uuid' },
      });
      expect(result).toEqual(mockMatch);
    });

    it('should return null if match not found', async () => {
      mockPrismaClient.match.findUnique.mockResolvedValueOnce(null);

      const result = await dao.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByPlayerId', () => {
    it('should find all matches for a player', async () => {
      const mockMatches = [
        { id: 'match-1', player1Id: 100, player2Id: 101 },
        { id: 'match-2', player1Id: 102, player2Id: 100 },
      ];
      mockPrismaClient.match.findMany.mockResolvedValueOnce(mockMatches);

      const result = await dao.findByPlayerId(100);

      expect(mockPrismaClient.match.findMany).toBeCalledWith({
        where: {
          OR: [{ player1Id: 100 }, { player2Id: 100 }],
        },
        orderBy: { scheduledAt: 'desc' },
      });
      expect(result).toEqual(mockMatches);
    });
  });

  describe('findByTournamentId', () => {
    it('should find all matches for a tournament ordered by round and bracketPosition', async () => {
      const mockMatches = [
        { id: 'match-1', tournamentId: 5, round: 1, bracketPosition: 0 },
        { id: 'match-2', tournamentId: 5, round: 1, bracketPosition: 1 },
      ];
      mockPrismaClient.match.findMany.mockResolvedValueOnce(mockMatches);

      const result = await dao.findByTournamentId(5);

      expect(mockPrismaClient.match.findMany).toBeCalledWith({
        where: { tournamentId: 5 },
        orderBy: [{ round: 'asc' }, { bracketPosition: 'asc' }],
      });
      expect(result).toEqual(mockMatches);
    });
  });

  describe('findByStatus', () => {
    it('should find matches by status', async () => {
      const mockMatches = [
        { id: 'match-1', status: 'SCHEDULED' },
        { id: 'match-2', status: 'SCHEDULED' },
      ];
      mockPrismaClient.match.findMany.mockResolvedValueOnce(mockMatches);

      const result = await dao.findByStatus('SCHEDULED');

      expect(mockPrismaClient.match.findMany).toBeCalledWith({
        where: { status: 'SCHEDULED' },
        orderBy: { scheduledAt: 'asc' },
      });
      expect(result).toEqual(mockMatches);
    });
  });

  describe('findUnacknowledged', () => {
    it('should find matches pending acknowledgement past deadline', async () => {
      const mockMatches = [
        {
          id: 'match-1',
          status: 'PENDING_ACKNOWLEDGEMENT',
          deadline: new Date('2026-01-01'),
        },
      ];
      mockPrismaClient.match.findMany.mockResolvedValueOnce(mockMatches);

      const result = await dao.findUnacknowledged();

      expect(mockPrismaClient.match.findMany).toBeCalledWith({
        where: {
          deadline: { lt: expect.any(Date) },
          status: 'PENDING_ACKNOWLEDGEMENT',
        },
      });
      expect(result).toEqual(mockMatches);
    });
  });

  describe('findOverdue', () => {
    it('should find scheduled matches past deadline', async () => {
      const mockMatches = [
        {
          id: 'match-1',
          status: 'SCHEDULED',
          deadline: new Date('2026-01-01'),
        },
      ];
      mockPrismaClient.match.findMany.mockResolvedValueOnce(mockMatches);

      const result = await dao.findOverdue();

      expect(mockPrismaClient.match.findMany).toBeCalledWith({
        where: {
          deadline: { lt: expect.any(Date) },
          status: 'SCHEDULED',
        },
      });
      expect(result).toEqual(mockMatches);
    });

    it('should not include IN_PROGRESS matches', async () => {
      mockPrismaClient.match.findMany.mockResolvedValueOnce([]);

      await dao.findOverdue();

      expect(mockPrismaClient.match.findMany).toBeCalledWith({
        where: {
          deadline: { lt: expect.any(Date) },
          status: 'SCHEDULED',
        },
      });
    });
  });

  describe('updateStatus', () => {
    it('should update match status to IN_PROGRESS and set startedAt', async () => {
      const mockMatch = {
        id: 'match-uuid',
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      };
      mockPrismaClient.match.update.mockResolvedValueOnce(mockMatch);

      const result = await dao.updateStatus('match-uuid', 'IN_PROGRESS');

      expect(mockPrismaClient.match.update).toBeCalledWith({
        where: { id: 'match-uuid' },
        data: {
          status: 'IN_PROGRESS',
          startedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(mockMatch);
    });

    it('should update match status to COMPLETED and set completedAt', async () => {
      const mockMatch = {
        id: 'match-uuid',
        status: 'COMPLETED',
        completedAt: new Date(),
      };
      mockPrismaClient.match.update.mockResolvedValueOnce(mockMatch);

      const result = await dao.updateStatus('match-uuid', 'COMPLETED');

      expect(mockPrismaClient.match.update).toBeCalledWith({
        where: { id: 'match-uuid' },
        data: {
          status: 'COMPLETED',
          completedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(mockMatch);
    });

    it('should update match status to FORFEITED and set completedAt', async () => {
      const mockMatch = {
        id: 'match-uuid',
        status: 'FORFEITED',
        completedAt: new Date(),
      };
      mockPrismaClient.match.update.mockResolvedValueOnce(mockMatch);

      const result = await dao.updateStatus('match-uuid', 'FORFEITED');

      expect(mockPrismaClient.match.update).toBeCalledWith({
        where: { id: 'match-uuid' },
        data: {
          status: 'FORFEITED',
          completedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(mockMatch);
    });
  });

  describe('recordResult', () => {
    it('should record match result and mark as COMPLETED', async () => {
      const mockMatch = {
        id: 'match-uuid',
        status: 'COMPLETED',
        winnerId: 100,
        player1Score: 7,
        player2Score: 5,
        completedAt: new Date(),
      };
      mockPrismaClient.match.update.mockResolvedValueOnce(mockMatch);

      const result = await dao.recordResult('match-uuid', {
        winnerId: 100,
        player1Score: 7,
        player2Score: 5,
        resultSource: 'game_service',
      });

      expect(mockPrismaClient.match.update).toBeCalledWith({
        where: { id: 'match-uuid' },
        data: {
          winnerId: 100,
          player1Score: 7,
          player2Score: 5,
          resultSource: 'game_service',
          status: 'COMPLETED',
          completedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(mockMatch);
    });

    it('should handle tie (null winner)', async () => {
      const mockMatch = {
        id: 'match-uuid',
        winnerId: null,
        player1Score: 5,
        player2Score: 5,
      };
      mockPrismaClient.match.update.mockResolvedValueOnce(mockMatch);

      await dao.recordResult('match-uuid', {
        winnerId: null,
        player1Score: 5,
        player2Score: 5,
        resultSource: 'game_service',
      });

      expect(mockPrismaClient.match.update).toBeCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            winnerId: null,
          }),
        })
      );
    });
  });

  describe('recordAcknowledgement', () => {
    it('should record player1 acknowledgement', async () => {
      const mockMatch = {
        id: 'match-uuid',
        player1Id: 100,
        player2Id: 101,
        player1Acknowledged: false,
        player2Acknowledged: false,
        status: 'PENDING_ACKNOWLEDGEMENT',
      };
      mockPrismaClient.match.findUnique.mockResolvedValueOnce(mockMatch);
      mockPrismaClient.match.update.mockResolvedValueOnce({
        ...mockMatch,
        player1Acknowledged: true,
      });

      await dao.recordAcknowledgement('match-uuid', 100);

      expect(mockPrismaClient.match.update).toBeCalledWith({
        where: { id: 'match-uuid' },
        data: {
          player1Acknowledged: true,
          player2Acknowledged: false,
        },
      });
    });

    it('should record player2 acknowledgement', async () => {
      const mockMatch = {
        id: 'match-uuid',
        player1Id: 100,
        player2Id: 101,
        player1Acknowledged: false,
        player2Acknowledged: false,
        status: 'PENDING_ACKNOWLEDGEMENT',
      };
      mockPrismaClient.match.findUnique.mockResolvedValueOnce(mockMatch);
      mockPrismaClient.match.update.mockResolvedValueOnce({
        ...mockMatch,
        player2Acknowledged: true,
      });

      await dao.recordAcknowledgement('match-uuid', 101);

      expect(mockPrismaClient.match.update).toBeCalledWith({
        where: { id: 'match-uuid' },
        data: {
          player1Acknowledged: false,
          player2Acknowledged: true,
        },
      });
    });

    it('should transition to SCHEDULED when both players acknowledge', async () => {
      const mockMatch = {
        id: 'match-uuid',
        player1Id: 100,
        player2Id: 101,
        player1Acknowledged: true,
        player2Acknowledged: false,
        status: 'PENDING_ACKNOWLEDGEMENT',
      };
      mockPrismaClient.match.findUnique.mockResolvedValueOnce(mockMatch);
      mockPrismaClient.match.update.mockResolvedValueOnce({
        ...mockMatch,
        player2Acknowledged: true,
        status: 'SCHEDULED',
      });

      await dao.recordAcknowledgement('match-uuid', 101);

      expect(mockPrismaClient.match.update).toBeCalledWith({
        where: { id: 'match-uuid' },
        data: {
          player1Acknowledged: true,
          player2Acknowledged: true,
          status: 'SCHEDULED',
        },
      });
    });

    it('should throw error if match not found', async () => {
      mockPrismaClient.match.findUnique.mockResolvedValueOnce(null);

      await expect(dao.recordAcknowledgement('invalid', 100)).rejects.toThrow(
        'Match invalid not found'
      );
    });

    it('should throw error if player is not part of match', async () => {
      const mockMatch = {
        id: 'match-uuid',
        player1Id: 100,
        player2Id: 101,
      };
      mockPrismaClient.match.findUnique.mockResolvedValueOnce(mockMatch);

      await expect(dao.recordAcknowledgement('match-uuid', 999)).rejects.toThrow(
        'Player 999 is not part of match match-uuid'
      );
    });
  });

  describe('setGameSessionId', () => {
    it('should set game session ID', async () => {
      const mockMatch = {
        id: 'match-uuid',
        gameSessionId: 'game-session-123',
      };
      mockPrismaClient.match.update.mockResolvedValueOnce(mockMatch);

      const result = await dao.setGameSessionId('match-uuid', 'game-session-123');

      expect(mockPrismaClient.match.update).toBeCalledWith({
        where: { id: 'match-uuid' },
        data: { gameSessionId: 'game-session-123' },
      });
      expect(result).toEqual(mockMatch);
    });
  });

  describe('delete', () => {
    it('should delete a match', async () => {
      await dao.delete('match-uuid');

      expect(mockPrismaClient.match.delete).toBeCalledWith({
        where: { id: 'match-uuid' },
      });
    });

    it('should handle deleting non-existent match', async () => {
      mockPrismaClient.match.delete.mockRejectedValueOnce(
        new Error('Record not found')
      );

      await expect(dao.delete('invalid')).rejects.toThrow('Record not found');
    });
  });

  describe('countByStatus', () => {
    it('should count matches by status', async () => {
      mockPrismaClient.match.count.mockResolvedValueOnce(5);

      const result = await dao.countByStatus('SCHEDULED');

      expect(mockPrismaClient.match.count).toBeCalledWith({
        where: { status: 'SCHEDULED' },
      });
      expect(result).toBe(5);
    });
  });

  describe('findNextQueuedMatch', () => {
    it('should find next queued match for a tournament', async () => {
      const mockMatch = {
        id: 'match-2',
        tournamentId: 5,
        status: 'PENDING_ACKNOWLEDGEMENT',
        deadline: null,
        round: 1,
        bracketPosition: 1,
      };
      mockPrismaClient.match.findFirst.mockResolvedValueOnce(mockMatch);

      const result = await dao.findNextQueuedMatch(5);

      expect(mockPrismaClient.match.findFirst).toBeCalledWith({
        where: {
          tournamentId: 5,
          status: 'PENDING_ACKNOWLEDGEMENT',
          deadline: null,
        },
        orderBy: [{ round: 'asc' }, { bracketPosition: 'asc' }],
      });
      expect(result).toEqual(mockMatch);
    });
  });

  describe('activateMatch', () => {
    it('should activate a queued match with a deadline', async () => {
      const deadline = new Date('2026-01-01T12:00:00Z');
      const mockMatch = {
        id: 'match-uuid',
        status: 'PENDING_ACKNOWLEDGEMENT',
        deadline,
      };
      mockPrismaClient.match.update.mockResolvedValueOnce(mockMatch);

      const result = await dao.activateMatch('match-uuid', deadline);

      expect(mockPrismaClient.match.update).toBeCalledWith({
        where: { id: 'match-uuid' },
        data: {
          deadline,
          status: 'PENDING_ACKNOWLEDGEMENT',
          player1Acknowledged: false,
          player2Acknowledged: false,
        },
      });
      expect(result).toEqual(mockMatch);
    });
  });

  describe('resetToPendingAck', () => {
    it('should reset match to PENDING_ACKNOWLEDGEMENT with fresh deadline', async () => {
      const deadline = new Date('2026-01-01T12:00:00Z');
      const mockMatch = {
        id: 'match-uuid',
        status: 'PENDING_ACKNOWLEDGEMENT',
        deadline,
      };
      mockPrismaClient.match.update.mockResolvedValueOnce(mockMatch);

      const result = await dao.resetToPendingAck('match-uuid', deadline);

      expect(mockPrismaClient.match.update).toBeCalledWith({
        where: { id: 'match-uuid' },
        data: {
          status: 'PENDING_ACKNOWLEDGEMENT',
          deadline,
          player1Acknowledged: false,
          player2Acknowledged: false,
          gameSessionId: null,
          startedAt: null,
        },
      });
      expect(result).toEqual(mockMatch);
    });
  });

  describe('findCompletedInRound', () => {
    it('should find completed matches in a tournament round', async () => {
      const mockMatches = [
        { id: 'match-1', tournamentId: 5, round: 1, status: 'COMPLETED' },
        { id: 'match-2', tournamentId: 5, round: 1, status: 'FORFEITED' },
      ];
      mockPrismaClient.match.findMany.mockResolvedValueOnce(mockMatches);

      const result = await dao.findCompletedInRound(5, 1);

      expect(mockPrismaClient.match.findMany).toBeCalledWith({
        where: {
          tournamentId: 5,
          round: 1,
          status: { in: ['COMPLETED', 'FORFEITED', 'TIMEOUT'] },
        },
        orderBy: { bracketPosition: 'asc' },
      });
      expect(result).toEqual(mockMatches);
    });
  });

  describe('countInRound', () => {
    it('should count matches in a tournament round', async () => {
      mockPrismaClient.match.count.mockResolvedValueOnce(4);

      const result = await dao.countInRound(5, 1);

      expect(mockPrismaClient.match.count).toBeCalledWith({
        where: { tournamentId: 5, round: 1 },
      });
      expect(result).toBe(4);
    });
  });

  describe('cancelMatch', () => {
    it('should cancel a match with partial scores', async () => {
      const mockMatch = {
        id: 'match-uuid',
        status: 'CANCELLED',
        player1Score: 3,
        player2Score: 2,
      };
      mockPrismaClient.match.update.mockResolvedValueOnce(mockMatch);

      const result = await dao.cancelMatch('match-uuid', {
        player1Score: 3,
        player2Score: 2,
        resultSource: 'game_service_cancelled',
      });

      expect(mockPrismaClient.match.update).toBeCalledWith({
        where: { id: 'match-uuid' },
        data: {
          player1Score: 3,
          player2Score: 2,
          resultSource: 'game_service_cancelled',
          status: 'CANCELLED',
          completedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(mockMatch);
    });
  });

  describe('recordTimeout', () => {
    it('should record match timeout', async () => {
      const mockMatch = {
        id: 'match-uuid',
        status: 'TIMEOUT',
        winnerId: 100,
      };
      mockPrismaClient.match.update.mockResolvedValueOnce(mockMatch);

      const result = await dao.recordTimeout('match-uuid', {
        winnerId: 100,
        player1Score: 7,
        player2Score: 0,
        resultSource: 'timeout',
      });

      expect(mockPrismaClient.match.update).toBeCalledWith({
        where: { id: 'match-uuid' },
        data: {
          winnerId: 100,
          player1Score: 7,
          player2Score: 0,
          resultSource: 'timeout',
          status: 'TIMEOUT',
          completedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(mockMatch);
    });
  });
});
