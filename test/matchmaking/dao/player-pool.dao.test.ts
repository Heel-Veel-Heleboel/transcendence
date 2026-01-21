import { PlayerPoolDao } from '../../../src/matchmaking/src/dao/player-pool.dao.js';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockPrismaClient = {
  playerPool: {
    create: vi.fn(),
    delete: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
  },
};

describe('PlayerPoolDao', () => {
  let dao: PlayerPoolDao;

  beforeEach(() => {
    vi.clearAllMocks();
    dao = new PlayerPoolDao(mockPrismaClient as any);
  });

  describe('add', () => {
    it('should add a player to the pool', async () => {
      const mockPlayer = {
        id: 1,
        userId: 123,
        joinedAt: new Date(),
        lastActive: new Date(),
      };
      mockPrismaClient.playerPool.create.mockResolvedValueOnce(mockPlayer);

      const result = await dao.add(123);

      expect(mockPrismaClient.playerPool.create).toBeCalledWith({
        data: {
          userId: 123,
          joinedAt: expect.any(Date),
          lastActive: expect.any(Date),
        },
      });
      expect(result).toEqual(mockPlayer);
    });

    it('should handle duplicate user error', async () => {
      mockPrismaClient.playerPool.create.mockRejectedValueOnce(
        new Error('Unique constraint failed')
      );

      await expect(dao.add(123)).rejects.toThrow('Unique constraint failed');
    });
  });

  describe('remove', () => {
    it('should remove a player from the pool', async () => {
      await dao.remove(123);

      expect(mockPrismaClient.playerPool.delete).toBeCalledWith({
        where: { userId: 123 },
      });
    });

    it('should handle removing non-existent player', async () => {
      mockPrismaClient.playerPool.delete.mockRejectedValueOnce(
        new Error('Record not found')
      );

      await expect(dao.remove(999)).rejects.toThrow('Record not found');
    });
  });

  describe('findByUserId', () => {
    it('should find a player by userId', async () => {
      const mockPlayer = {
        id: 1,
        userId: 123,
        joinedAt: new Date(),
        lastActive: new Date(),
      };
      mockPrismaClient.playerPool.findUnique.mockResolvedValueOnce(mockPlayer);

      const result = await dao.findByUserId(123);

      expect(mockPrismaClient.playerPool.findUnique).toBeCalledWith({
        where: { userId: 123 },
      });
      expect(result).toEqual(mockPlayer);
    });

    it('should return null if player not found', async () => {
      mockPrismaClient.playerPool.findUnique.mockResolvedValueOnce(null);

      const result = await dao.findByUserId(999);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all players ordered by joinedAt', async () => {
      const mockPlayers = [
        { id: 1, userId: 100, joinedAt: new Date('2026-01-01'), lastActive: new Date() },
        { id: 2, userId: 101, joinedAt: new Date('2026-01-02'), lastActive: new Date() },
      ];
      mockPrismaClient.playerPool.findMany.mockResolvedValueOnce(mockPlayers);

      const result = await dao.findAll();

      expect(mockPrismaClient.playerPool.findMany).toBeCalledWith({
        orderBy: { joinedAt: 'asc' },
      });
      expect(result).toEqual(mockPlayers);
    });

    it('should return empty array when no players in pool', async () => {
      mockPrismaClient.playerPool.findMany.mockResolvedValueOnce([]);

      const result = await dao.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOldest', () => {
    it('should return oldest N players', async () => {
      const mockPlayers = [
        { id: 1, userId: 100, joinedAt: new Date('1995-01-01'), lastActive: new Date() },
        { id: 2, userId: 101, joinedAt: new Date('2001-01-02'), lastActive: new Date() },
      ];
      mockPrismaClient.playerPool.findMany.mockResolvedValueOnce(mockPlayers);

      const result = await dao.findOldest(2);

      expect(mockPrismaClient.playerPool.findMany).toBeCalledWith({
        orderBy: { joinedAt: 'asc' },
        take: 2,
      });
      expect(result).toEqual(mockPlayers);
    });

    it('should handle limit greater than pool size', async () => {
      const mockPlayers = [
        { id: 1, userId: 100, joinedAt: new Date('2026-01-01'), lastActive: new Date() },
      ];
      mockPrismaClient.playerPool.findMany.mockResolvedValueOnce(mockPlayers);

      const result = await dao.findOldest(10);

      expect(result).toEqual(mockPlayers);
      expect(result.length).toBe(1);
    });
  });

  describe('updateLastActive', () => {
    it('should update lastActive timestamp', async () => {
      await dao.updateLastActive(123);

      expect(mockPrismaClient.playerPool.update).toBeCalledWith({
        where: { userId: 123 },
        data: { lastActive: expect.any(Date) },
      });
    });

    it('should handle updating non-existent player', async () => {
      mockPrismaClient.playerPool.update.mockRejectedValueOnce(
        new Error('Record not found')
      );

      await expect(dao.updateLastActive(999)).rejects.toThrow('Record not found');
    });
  });

  describe('removeStale', () => {
    it('should remove players who joined before specified date', async () => {
      const cutoffDate = new Date('2026-01-01');
      mockPrismaClient.playerPool.deleteMany.mockResolvedValueOnce({ count: 3 });

      const result = await dao.removeStale(cutoffDate);

      expect(mockPrismaClient.playerPool.deleteMany).toBeCalledWith({
        where: {
          joinedAt: { lt: cutoffDate },
        },
      });
      expect(result).toBe(3);
    });

    it('should return 0 when no stale players found', async () => {
      const cutoffDate = new Date('2026-01-01');
      mockPrismaClient.playerPool.deleteMany.mockResolvedValueOnce({ count: 0 });

      const result = await dao.removeStale(cutoffDate);

      expect(result).toBe(0);
    });
  });

  describe('count', () => {
    it('should return total number of players in pool', async () => {
      mockPrismaClient.playerPool.count.mockResolvedValueOnce(5);

      const result = await dao.count();

      expect(mockPrismaClient.playerPool.count).toBeCalled();
      expect(result).toBe(5);
    });

    it('should return 0 when pool is empty', async () => {
      mockPrismaClient.playerPool.count.mockResolvedValueOnce(0);

      const result = await dao.count();

      expect(result).toBe(0);
    });
  });

  describe('exists', () => {
    it('should return true if player exists', async () => {
      const mockPlayer = {
        id: 1,
        userId: 123,
        joinedAt: new Date(),
        lastActive: new Date(),
      };
      mockPrismaClient.playerPool.findUnique.mockResolvedValueOnce(mockPlayer);

      const result = await dao.exists(123);

      expect(mockPrismaClient.playerPool.findUnique).toBeCalledWith({
        where: { userId: 123 },
      });
      expect(result).toBe(true);
    });

    it('should return false if player does not exist', async () => {
      mockPrismaClient.playerPool.findUnique.mockResolvedValueOnce(null);

      const result = await dao.exists(999);

      expect(result).toBe(false);
    });
  });
});
