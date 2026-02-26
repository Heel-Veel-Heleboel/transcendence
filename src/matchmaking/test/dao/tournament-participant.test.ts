import { TournamentParticipantDao } from '../../src/dao/tournament-participant.js';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockPrismaClient = {
  tournamentParticipant: {
    create: vi.fn(),
    delete: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  $transaction: vi.fn(),
};

describe('TournamentParticipantDao', () => {
  let dao: TournamentParticipantDao;

  beforeEach(() => {
    vi.clearAllMocks();
    dao = new TournamentParticipantDao(mockPrismaClient as any);
  });

  describe('register', () => {
    it('should register a player for a tournament', async () => {
      const mockParticipant = {
        id: 1,
        tournamentId: 1,
        userId: 100,
        registeredAt: new Date(),
        wins: 0,
        losses: 0,
        scoreDiff: 0,
        finalRank: null,
      };
      mockPrismaClient.tournamentParticipant.create.mockResolvedValueOnce(mockParticipant);

      const result = await dao.register(1, 100);

      expect(mockPrismaClient.tournamentParticipant.create).toBeCalledWith({
        data: {
          tournamentId: 1,
          userId: 100,
        },
      });
      expect(result).toEqual(mockParticipant);
    });
  });

  describe('unregister', () => {
    it('should unregister a player from a tournament', async () => {
      await dao.unregister(1, 100);

      expect(mockPrismaClient.tournamentParticipant.delete).toBeCalledWith({
        where: {
          tournamentId_userId: { tournamentId: 1, userId: 100 },
        },
      });
    });
  });

  describe('findByTournamentAndUser', () => {
    it('should find a participant by tournament and user', async () => {
      const mockParticipant = {
        id: 1,
        tournamentId: 1,
        userId: 100,
      };
      mockPrismaClient.tournamentParticipant.findUnique.mockResolvedValueOnce(mockParticipant);

      const result = await dao.findByTournamentAndUser(1, 100);

      expect(mockPrismaClient.tournamentParticipant.findUnique).toBeCalledWith({
        where: {
          tournamentId_userId: { tournamentId: 1, userId: 100 },
        },
      });
      expect(result).toEqual(mockParticipant);
    });

    it('should return null if not found', async () => {
      mockPrismaClient.tournamentParticipant.findUnique.mockResolvedValueOnce(null);

      const result = await dao.findByTournamentAndUser(1, 999);

      expect(result).toBeNull();
    });
  });

  describe('isRegistered', () => {
    it('should return true if player is registered', async () => {
      mockPrismaClient.tournamentParticipant.findUnique.mockResolvedValueOnce({
        id: 1,
        tournamentId: 1,
        userId: 100,
      });

      const result = await dao.isRegistered(1, 100);

      expect(result).toBe(true);
    });

    it('should return false if player is not registered', async () => {
      mockPrismaClient.tournamentParticipant.findUnique.mockResolvedValueOnce(null);

      const result = await dao.isRegistered(1, 999);

      expect(result).toBe(false);
    });
  });

  describe('findByTournament', () => {
    it('should find all participants for a tournament', async () => {
      const mockParticipants = [
        { id: 1, tournamentId: 1, userId: 100 },
        { id: 2, tournamentId: 1, userId: 101 },
      ];
      mockPrismaClient.tournamentParticipant.findMany.mockResolvedValueOnce(mockParticipants);

      const result = await dao.findByTournament(1);

      expect(mockPrismaClient.tournamentParticipant.findMany).toBeCalledWith({
        where: { tournamentId: 1 },
        orderBy: { registeredAt: 'asc' },
      });
      expect(result).toEqual(mockParticipants);
    });
  });

  describe('findByUser', () => {
    it('should find all tournaments for a user', async () => {
      const mockParticipants = [
        { id: 1, tournamentId: 1, userId: 100 },
        { id: 2, tournamentId: 2, userId: 100 },
      ];
      mockPrismaClient.tournamentParticipant.findMany.mockResolvedValueOnce(mockParticipants);

      const result = await dao.findByUser(100);

      expect(mockPrismaClient.tournamentParticipant.findMany).toBeCalledWith({
        where: { userId: 100 },
        orderBy: { registeredAt: 'desc' },
      });
      expect(result).toEqual(mockParticipants);
    });
  });

  describe('updateStats', () => {
    it('should update participant stats', async () => {
      const mockParticipant = {
        id: 1,
        wins: 3,
        losses: 1,
        scoreDiff: 10,
      };
      mockPrismaClient.tournamentParticipant.update.mockResolvedValueOnce(mockParticipant);

      const result = await dao.updateStats(1, 100, {
        wins: 3,
        losses: 1,
        scoreDiff: 10,
      });

      expect(mockPrismaClient.tournamentParticipant.update).toBeCalledWith({
        where: {
          tournamentId_userId: { tournamentId: 1, userId: 100 },
        },
        data: {
          wins: 3,
          losses: 1,
          scoreDiff: 10,
        },
      });
      expect(result).toEqual(mockParticipant);
    });
  });

  describe('incrementWins', () => {
    it('should increment wins and update score diff', async () => {
      const mockParticipant = {
        id: 1,
        wins: 2,
        scoreDiff: 5,
      };
      mockPrismaClient.tournamentParticipant.update.mockResolvedValueOnce(mockParticipant);

      const result = await dao.incrementWins(1, 100, 3);

      expect(mockPrismaClient.tournamentParticipant.update).toBeCalledWith({
        where: {
          tournamentId_userId: { tournamentId: 1, userId: 100 },
        },
        data: {
          wins: { increment: 1 },
          scoreDiff: { increment: 3 },
        },
      });
      expect(result).toEqual(mockParticipant);
    });
  });

  describe('incrementLosses', () => {
    it('should increment losses and update score diff (negative)', async () => {
      const mockParticipant = {
        id: 1,
        losses: 2,
        scoreDiff: -5,
      };
      mockPrismaClient.tournamentParticipant.update.mockResolvedValueOnce(mockParticipant);

      const result = await dao.incrementLosses(1, 100, -3);

      expect(mockPrismaClient.tournamentParticipant.update).toBeCalledWith({
        where: {
          tournamentId_userId: { tournamentId: 1, userId: 100 },
        },
        data: {
          losses: { increment: 1 },
          scoreDiff: { increment: -3 },
        },
      });
      expect(result).toEqual(mockParticipant);
    });
  });

  describe('setFinalRank', () => {
    it('should set final rank for a participant', async () => {
      const mockParticipant = {
        id: 1,
        finalRank: 1,
      };
      mockPrismaClient.tournamentParticipant.update.mockResolvedValueOnce(mockParticipant);

      const result = await dao.setFinalRank(1, 100, 1);

      expect(mockPrismaClient.tournamentParticipant.update).toBeCalledWith({
        where: {
          tournamentId_userId: { tournamentId: 1, userId: 100 },
        },
        data: { finalRank: 1 },
      });
      expect(result).toEqual(mockParticipant);
    });
  });

  describe('getRankings', () => {
    it('should return rankings sorted by wins then scoreDiff', async () => {
      const mockParticipants = [
        { userId: 100, wins: 3, losses: 1, scoreDiff: 10 },
        { userId: 101, wins: 2, losses: 2, scoreDiff: 5 },
        { userId: 102, wins: 1, losses: 3, scoreDiff: -15 },
      ];
      mockPrismaClient.tournamentParticipant.findMany.mockResolvedValueOnce(mockParticipants);

      const result = await dao.getRankings(1);

      expect(mockPrismaClient.tournamentParticipant.findMany).toBeCalledWith({
        where: { tournamentId: 1 },
        orderBy: [{ wins: 'desc' }, { scoreDiff: 'desc' }],
      });
      expect(result).toEqual([
        { rank: 1, userId: 100, wins: 3, losses: 1, scoreDiff: 10, matchesPlayed: 4 },
        { rank: 2, userId: 101, wins: 2, losses: 2, scoreDiff: 5, matchesPlayed: 4 },
        { rank: 3, userId: 102, wins: 1, losses: 3, scoreDiff: -15, matchesPlayed: 4 },
      ]);
    });

    it('should handle ties by scoreDiff', async () => {
      const mockParticipants = [
        { userId: 100, wins: 2, losses: 2, scoreDiff: 8 },
        { userId: 101, wins: 2, losses: 2, scoreDiff: 3 },
        { userId: 102, wins: 2, losses: 2, scoreDiff: -11 },
      ];
      mockPrismaClient.tournamentParticipant.findMany.mockResolvedValueOnce(mockParticipants);

      const result = await dao.getRankings(1);

      expect(result[0].userId).toBe(100);
      expect(result[1].userId).toBe(101);
      expect(result[2].userId).toBe(102);
    });
  });

  describe('count', () => {
    it('should count participants in a tournament', async () => {
      mockPrismaClient.tournamentParticipant.count.mockResolvedValueOnce(5);

      const result = await dao.count(1);

      expect(mockPrismaClient.tournamentParticipant.count).toBeCalledWith({
        where: { tournamentId: 1 },
      });
      expect(result).toBe(5);
    });
  });

  describe('getParticipantUserIds', () => {
    it('should return array of user IDs', async () => {
      mockPrismaClient.tournamentParticipant.findMany.mockResolvedValueOnce([
        { userId: 100 },
        { userId: 101 },
        { userId: 102 },
      ]);

      const result = await dao.getParticipantUserIds(1);

      expect(mockPrismaClient.tournamentParticipant.findMany).toBeCalledWith({
        where: { tournamentId: 1 },
        select: { userId: true },
      });
      expect(result).toEqual([100, 101, 102]);
    });
  });

  describe('findTiedParticipants', () => {
    it('should find participants with matching wins and scoreDiff', async () => {
      const mockParticipants = [
        { userId: 100, wins: 2, scoreDiff: 5 },
        { userId: 101, wins: 2, scoreDiff: 5 },
      ];
      mockPrismaClient.tournamentParticipant.findMany.mockResolvedValueOnce(mockParticipants);

      const result = await dao.findTiedParticipants(1, 2, 5);

      expect(mockPrismaClient.tournamentParticipant.findMany).toBeCalledWith({
        where: {
          tournamentId: 1,
          wins: 2,
          scoreDiff: 5,
        },
      });
      expect(result).toEqual(mockParticipants);
    });
  });

  describe('setAllFinalRanks', () => {
    it('should set final ranks for all participants in a transaction', async () => {
      const rankings = [
        { tournamentId: 1, userId: 100, rank: 1 },
        { tournamentId: 1, userId: 101, rank: 2 },
        { tournamentId: 1, userId: 102, rank: 3 },
      ];

      mockPrismaClient.$transaction.mockResolvedValueOnce([]);

      await dao.setAllFinalRanks(rankings);

      expect(mockPrismaClient.$transaction).toBeCalledWith([
        mockPrismaClient.tournamentParticipant.update({
          where: { tournamentId_userId: { tournamentId: 1, userId: 100 } },
          data: { finalRank: 1 },
        }),
        mockPrismaClient.tournamentParticipant.update({
          where: { tournamentId_userId: { tournamentId: 1, userId: 101 } },
          data: { finalRank: 2 },
        }),
        mockPrismaClient.tournamentParticipant.update({
          where: { tournamentId_userId: { tournamentId: 1, userId: 102 } },
          data: { finalRank: 3 },
        }),
      ]);
    });
  });
});
