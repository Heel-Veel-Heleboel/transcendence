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
        username: 'user100',
        registeredAt: new Date(),
        seed: null,
        eliminatedIn: null,
        finalRank: null,
      };
      mockPrismaClient.tournamentParticipant.create.mockResolvedValueOnce(mockParticipant);

      const result = await dao.register(1, 100, 'user100');

      expect(mockPrismaClient.tournamentParticipant.create).toBeCalledWith({
        data: {
          tournamentId: 1,
          userId: 100,
          username: 'user100',
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

  describe('setSeed', () => {
    it('should set seed position for a participant', async () => {
      const mockParticipant = {
        id: 1,
        tournamentId: 1,
        userId: 100,
        seed: 3,
      };
      mockPrismaClient.tournamentParticipant.update.mockResolvedValueOnce(mockParticipant);

      const result = await dao.setSeed(1, 100, 3);

      expect(mockPrismaClient.tournamentParticipant.update).toBeCalledWith({
        where: {
          tournamentId_userId: { tournamentId: 1, userId: 100 },
        },
        data: { seed: 3 },
      });
      expect(result).toEqual(mockParticipant);
    });
  });

  describe('eliminate', () => {
    it('should mark a participant as eliminated in a round', async () => {
      const mockParticipant = {
        id: 1,
        tournamentId: 1,
        userId: 100,
        eliminatedIn: 2,
      };
      mockPrismaClient.tournamentParticipant.update.mockResolvedValueOnce(mockParticipant);

      const result = await dao.eliminate(1, 100, 2);

      expect(mockPrismaClient.tournamentParticipant.update).toBeCalledWith({
        where: {
          tournamentId_userId: { tournamentId: 1, userId: 100 },
        },
        data: { eliminatedIn: 2 },
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
    it('should return rankings sorted by finalRank then eliminatedIn', async () => {
      const mockParticipants = [
        { userId: 100, username: 'user100', seed: 1, eliminatedIn: null, finalRank: 1 },
        { userId: 101, username: 'user101', seed: 2, eliminatedIn: 2, finalRank: 2 },
        { userId: 102, username: 'user102', seed: 3, eliminatedIn: 1, finalRank: 3 },
      ];
      mockPrismaClient.tournamentParticipant.findMany.mockResolvedValueOnce(mockParticipants);

      const result = await dao.getRankings(1);

      expect(mockPrismaClient.tournamentParticipant.findMany).toBeCalledWith({
        where: { tournamentId: 1 },
        orderBy: [{ finalRank: 'asc' }, { eliminatedIn: 'desc' }],
      });
      expect(result).toEqual([
        { rank: 1, userId: 100, username: 'user100', seed: 1, eliminatedIn: null },
        { rank: 2, userId: 101, username: 'user101', seed: 2, eliminatedIn: 2 },
        { rank: 3, userId: 102, username: 'user102', seed: 3, eliminatedIn: 1 },
      ]);
    });

    it('should use index-based rank when finalRank is null', async () => {
      const mockParticipants = [
        { userId: 100, username: 'user100', seed: 1, eliminatedIn: null, finalRank: null },
        { userId: 101, username: 'user101', seed: 2, eliminatedIn: 2, finalRank: null },
      ];
      mockPrismaClient.tournamentParticipant.findMany.mockResolvedValueOnce(mockParticipants);

      const result = await dao.getRankings(1);

      expect(result[0].rank).toBe(1);
      expect(result[1].rank).toBe(2);
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

  describe('getParticipantsWithUsernames', () => {
    it('should return participants with usernames', async () => {
      const mockParticipants = [
        { userId: 100, username: 'user100' },
        { userId: 101, username: 'user101' },
      ];
      mockPrismaClient.tournamentParticipant.findMany.mockResolvedValueOnce(mockParticipants);

      const result = await dao.getParticipantsWithUsernames(1);

      expect(mockPrismaClient.tournamentParticipant.findMany).toBeCalledWith({
        where: { tournamentId: 1 },
        select: { userId: true, username: true },
        orderBy: { registeredAt: 'asc' },
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

      mockPrismaClient.tournamentParticipant.update.mockReturnValue(Promise.resolve());
      mockPrismaClient.$transaction.mockResolvedValueOnce([]);

      await dao.setAllFinalRanks(rankings);

      expect(mockPrismaClient.$transaction).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.any(Promise),
          expect.any(Promise),
          expect.any(Promise),
        ])
      );
    });
  });
});
