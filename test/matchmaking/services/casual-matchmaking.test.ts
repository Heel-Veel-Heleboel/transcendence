import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MatchmakingService } from '../../../src/matchmaking/src/services/casual-matchmaking.js';
import { MatchDao } from '../../../src/matchmaking/src/dao/match.js';
import { Match } from '../../../src/matchmaking/generated/prisma/index.js';

describe('MatchmakingService', () => {
  let service: MatchmakingService;
  let mockMatchDao: MatchDao;

  const TEST_ACK_TIMEOUT_MS = 100; // 100ms instead of 5 minutes
  const TEST_MAX_WAIT_TIME_MS = 1000; // 1 second instead of 30 minutes

  beforeEach(async () => {
    mockMatchDao = {
      create: vi.fn(),
      findById: vi.fn(),
      findByPlayerId: vi.fn(),
      findByTournamentId: vi.fn(),
      findByStatus: vi.fn(),
      findUnacknowledged: vi.fn(),
      findOverdue: vi.fn(),
      updateStatus: vi.fn(),
      recordResult: vi.fn(),
      recordAcknowledgement: vi.fn(),
      handleAckForfeit: vi.fn(),
      setGameSessionId: vi.fn(),
      delete: vi.fn(),
      countByStatus: vi.fn(),
      findBetweenPlayers: vi.fn(),
      acknowledge: vi.fn(),
      completeMatch: vi.fn(),
      findActiveMatchForUser: vi.fn(),
    } as any;

    service = new MatchmakingService(mockMatchDao, undefined, {
      ackTimeoutMs: TEST_ACK_TIMEOUT_MS,
      maxWaitTimeMs: TEST_MAX_WAIT_TIME_MS,
    });

    await service.initialize();
  });

  afterEach(async () => {
    await service.shutdown();
  });

  describe('initialize()', () => {
    it('should clear the pool on initialization', async () => {
      service.joinPool(1);
      expect(service.getPoolSize()).toBe(1);

      await service.initialize();
      expect(service.getPoolSize()).toBe(0);
    });
  });

  describe('joinPool()', () => {
    it('should add a player to the pool', () => {
      const result = service.joinPool(1);

      expect(result.success).toBe(true);
      expect(result.queuePosition).toBe(1);
      expect(service.getPoolSize()).toBe(1);
      expect(service.isInPool(1)).toBe(true);
    });

    it('should return queue position for new player', () => {
      service.joinPool(1);
      service.joinPool(2);
      const result = service.joinPool(3);

      expect(result.success).toBe(true);
      expect(result.queuePosition).toBe(3);
    });

    it('should return false if player already in pool', () => {
      service.joinPool(1);
      const result = service.joinPool(1);

      expect(result.success).toBe(false);
      expect(result.queuePosition).toBe(1);
      expect(service.getPoolSize()).toBe(1);
    });

    it('should not auto-pair (pairing is separate operation)', () => {
      service.joinPool(1);
      service.joinPool(2);

      // Players should still be in pool - pairing is manual
      expect(service.getPoolSize()).toBe(2);
      expect(service.isInPool(1)).toBe(true);
      expect(service.isInPool(2)).toBe(true);
      expect(mockMatchDao.create).not.toHaveBeenCalled();
    });
  });

  describe('leavePool()', () => {
    it('should remove a player from the pool', () => {
      service.joinPool(1);
      expect(service.isInPool(1)).toBe(true);

      const result = service.leavePool(1);

      expect(result.success).toBe(true);
      expect(service.getPoolSize()).toBe(0);
      expect(service.isInPool(1)).toBe(false);
    });

    it('should return false if player not in pool', () => {
      const result = service.leavePool(999);

      expect(result.success).toBe(false);
    });

    it('should maintain queue order after removal', () => {
      service.joinPool(1);
      service.joinPool(2);
      service.joinPool(3);

      service.leavePool(2);

      expect(service.getPoolSize()).toBe(2);
      expect(service.isInPool(1)).toBe(true);
      expect(service.isInPool(2)).toBe(false);
      expect(service.isInPool(3)).toBe(true);
    });
  });

  describe('tryFormPair()', () => {
    it('should return null when less than 2 players', () => {
      service.joinPool(1);

      const pair = service.tryFormPair();

      expect(pair).toBeNull();
      expect(service.getPoolSize()).toBe(1);
    });

    it('should return null when pool is empty', () => {
      const pair = service.tryFormPair();

      expect(pair).toBeNull();
    });

    it('should return pair and remove players from pool', () => {
      service.joinPool(1);
      service.joinPool(2);
      service.joinPool(3);

      const pair = service.tryFormPair();

      expect(pair).not.toBeNull();
      expect(pair!.player1.userId).toBe(1);
      expect(pair!.player2.userId).toBe(2);
      expect(service.getPoolSize()).toBe(1);
      expect(service.isInPool(1)).toBe(false);
      expect(service.isInPool(2)).toBe(false);
      expect(service.isInPool(3)).toBe(true);
    });

    it('should maintain FIFO order', () => {
      service.joinPool(1);
      service.joinPool(2);
      service.joinPool(3);
      service.joinPool(4);

      const pair1 = service.tryFormPair();
      const pair2 = service.tryFormPair();

      expect(pair1!.player1.userId).toBe(1);
      expect(pair1!.player2.userId).toBe(2);
      expect(pair2!.player1.userId).toBe(3);
      expect(pair2!.player2.userId).toBe(4);
    });
  });

  describe('createMatch()', () => {
    it('should create match in database', async () => {
      const mockMatch: Partial<Match> = {
        id: 'match-1',
        player1Id: 1,
        player2Id: 2,
        status: 'PENDING_ACKNOWLEDGEMENT',
      };
      vi.mocked(mockMatchDao.create).mockResolvedValue(mockMatch as Match);

      service.joinPool(1);
      service.joinPool(2);
      const pair = service.tryFormPair()!;

      const result = await service.createMatch(pair);

      expect(result.matchId).toBe('match-1');
      expect(mockMatchDao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          player1Id: 1,
          player2Id: 2,
        })
      );
    });

    it('should create match with deadline', async () => {
      vi.useFakeTimers();
      const now = new Date('2026-01-01T00:00:00.000Z');
      vi.setSystemTime(now);

      const mockMatch: Partial<Match> = {
        id: 'match-1',
        player1Id: 1,
        player2Id: 2,
        status: 'PENDING_ACKNOWLEDGEMENT',
      };
      vi.mocked(mockMatchDao.create).mockResolvedValue(mockMatch as Match);

      service.joinPool(1);
      service.joinPool(2);
      const pair = service.tryFormPair()!;

      await service.createMatch(pair);

      const expectedDeadline = new Date(now.getTime() + TEST_ACK_TIMEOUT_MS);

      expect(mockMatchDao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          player1Id: 1,
          player2Id: 2,
          deadline: expectedDeadline,
        })
      );

      vi.useRealTimers();
    });
  });

  describe('tryAutoPair()', () => {
    it('should pair and create match in one call', async () => {
      const mockMatch: Partial<Match> = {
        id: 'match-1',
        player1Id: 1,
        player2Id: 2,
        status: 'PENDING_ACKNOWLEDGEMENT',
      };
      vi.mocked(mockMatchDao.create).mockResolvedValue(mockMatch as Match);

      service.joinPool(1);
      service.joinPool(2);
      service.joinPool(3);

      const result = await service.tryAutoPair();

      expect(result.paired).toBe(true);
      expect(result.matchId).toBe('match-1');
      expect(service.getPoolSize()).toBe(1);
      expect(service.isInPool(3)).toBe(true);
    });

    it('should return paired: false when not enough players', async () => {
      service.joinPool(1);

      const result = await service.tryAutoPair();

      expect(result.paired).toBe(false);
      expect(result.matchId).toBeUndefined();
      expect(mockMatchDao.create).not.toHaveBeenCalled();
    });

    it('should return players to pool on DB error', async () => {
      vi.mocked(mockMatchDao.create).mockRejectedValue(new Error('DB error'));

      service.joinPool(1);
      service.joinPool(2);

      await expect(service.tryAutoPair()).rejects.toThrow('DB error');

      expect(service.getPoolSize()).toBe(2);
      expect(service.isInPool(1)).toBe(true);
      expect(service.isInPool(2)).toBe(true);
    });
  });

  describe('returnToPool()', () => {
    it('should add player to front of queue (priority)', () => {
      service.joinPool(1);
      service.joinPool(2);
      service.joinPool(3);

      service.returnToPool(99);

      const status = service.getPoolStatus(99);
      expect(status.queuePosition).toBe(1);
      expect(service.getPoolSize()).toBe(4);
    });

    it('should not add player if already in pool', () => {
      service.joinPool(1);
      expect(service.getPoolSize()).toBe(1);

      const result = service.returnToPool(1);

      expect(result.success).toBe(false);
      expect(service.getPoolSize()).toBe(1);
    });

    it('should give priority in next pairing', async () => {
      const mockMatch: Partial<Match> = {
        id: 'match-1',
        player1Id: 99,
        player2Id: 1,
        status: 'PENDING_ACKNOWLEDGEMENT',
      };
      vi.mocked(mockMatchDao.create).mockResolvedValue(mockMatch as Match);

      service.joinPool(1);
      service.joinPool(2);
      service.joinPool(3);

      service.returnToPool(99);

      const pair = service.tryFormPair()!;

      expect(pair.player1.userId).toBe(99);
      expect(pair.player2.userId).toBe(1);
    });
  });

  describe('getPoolStatus()', () => {
    it('should return status for player in pool', () => {
      service.joinPool(1);
      service.joinPool(2);
      service.joinPool(3);

      const status = service.getPoolStatus(2);

      expect(status.inPool).toBe(true);
      expect(status.queuePosition).toBe(2);
      expect(status.poolSize).toBe(3);
      expect(status.estimatedWaitMs).toBeDefined();
    });

    it('should return inPool false for player not in pool', () => {
      service.joinPool(1);

      const status = service.getPoolStatus(999);

      expect(status.inPool).toBe(false);
      expect(status.poolSize).toBe(1);
      expect(status.queuePosition).toBeUndefined();
    });

    it('should calculate estimated wait time correctly', () => {
      service.joinPool(1);
      service.joinPool(2);
      service.joinPool(3);

      const status1 = service.getPoolStatus(1);
      const status3 = service.getPoolStatus(3);

      expect(status1.estimatedWaitMs).toBe(0);

      expect(status3.estimatedWaitMs).toBe(30 * 1000);
    });
  });

  describe('cleanupStaleEntries()', () => {
    it('should remove entries older than max wait time', () => {
      vi.useFakeTimers();
      const now = new Date('2026-01-01T00:00:00.000Z');
      vi.setSystemTime(now);

      service.joinPool(1);

      vi.advanceTimersByTime(TEST_MAX_WAIT_TIME_MS + 100);

      service.joinPool(3); 

      const removed = service.cleanupStaleEntries();

      expect(removed).toBe(1); 
      expect(service.getPoolSize()).toBe(1); 
      expect(service.isInPool(3)).toBe(true);
      expect(service.isInPool(1)).toBe(false);

      vi.useRealTimers();
    });

    it('should not remove recent entries', () => {
      vi.useFakeTimers();
      const now = new Date('2026-01-01T00:00:00.000Z');
      vi.setSystemTime(now);

      service.joinPool(1);
      service.joinPool(2);

      vi.advanceTimersByTime(TEST_MAX_WAIT_TIME_MS / 2);

      const removed = service.cleanupStaleEntries();

      expect(removed).toBe(0);
      expect(service.getPoolSize()).toBe(2);

      vi.useRealTimers();
    });

    it('should return 0 for empty pool', () => {
      const removed = service.cleanupStaleEntries();
      expect(removed).toBe(0);
    });
  });

  describe('canFormPair()', () => {
    it('should return false when less than 2 players', () => {
      expect(service.canFormPair()).toBe(false);

      service.joinPool(1);
      expect(service.canFormPair()).toBe(false);
    });

    it('should return true when 2 or more players', () => {
      service.joinPool(1);
      service.joinPool(2);
      expect(service.canFormPair()).toBe(true);

      service.joinPool(3);
      expect(service.canFormPair()).toBe(true);
    });
  });

  describe('getPoolSize()', () => {
    it('should return correct pool size', () => {
      expect(service.getPoolSize()).toBe(0);
    });

    it('should track size as players join', () => {
      service.joinPool(1);
      expect(service.getPoolSize()).toBe(1);

      service.joinPool(2);
      expect(service.getPoolSize()).toBe(2);
    });
  });

  describe('isInPool()', () => {
    it('should return true for player in pool', () => {
      service.joinPool(1);
      expect(service.isInPool(1)).toBe(true);
    });

    it('should return false for player not in pool', () => {
      expect(service.isInPool(999)).toBe(false);
    });

    it('should return false after player leaves', () => {
      service.joinPool(1);
      service.leavePool(1);
      expect(service.isInPool(1)).toBe(false);
    });
  });

  describe('Integration: Realistic Matchmaking Flow', () => {
    it('should handle full matchmaking lifecycle', async () => {
      const mockMatch1: Partial<Match> = {
        id: 'match-1',
        player1Id: 1,
        player2Id: 2,
        status: 'PENDING_ACKNOWLEDGEMENT',
      };
      const mockMatch2: Partial<Match> = {
        id: 'match-2',
        player1Id: 1,
        player2Id: 3,
        status: 'PENDING_ACKNOWLEDGEMENT',
      };

      vi.mocked(mockMatchDao.create)
        .mockResolvedValueOnce(mockMatch1 as Match)
        .mockResolvedValueOnce(mockMatch2 as Match);

      service.joinPool(1);
      service.joinPool(2);

      const pair1 = service.tryFormPair()!;
      await service.createMatch(pair1);

      expect(service.getPoolSize()).toBe(0);

      service.joinPool(3);
      expect(service.getPoolSize()).toBe(1);

      service.returnToPool(1);

      const pair2 = service.tryFormPair()!;
      expect(pair2.player1.userId).toBe(1); 
      expect(pair2.player2.userId).toBe(3);

      await service.createMatch(pair2);

      expect(mockMatchDao.create).toHaveBeenCalledTimes(2);
      expect(service.getPoolSize()).toBe(0);
    });

    it('should handle player leaving before pairing', async () => {
      service.joinPool(1);
      service.joinPool(2);
      service.joinPool(3);

      service.leavePool(2);

      const mockMatch: Partial<Match> = {
        id: 'match-1',
        player1Id: 1,
        player2Id: 3,
        status: 'PENDING_ACKNOWLEDGEMENT',
      };
      vi.mocked(mockMatchDao.create).mockResolvedValue(mockMatch as Match);

      const pair = service.tryFormPair()!;

      expect(pair.player1.userId).toBe(1);
      expect(pair.player2.userId).toBe(3);
    });

    it('should handle route-style fire-and-forget pattern', async () => {
      const mockMatch: Partial<Match> = {
        id: 'match-1',
        player1Id: 1,
        player2Id: 2,
        status: 'PENDING_ACKNOWLEDGEMENT',
      };
      vi.mocked(mockMatchDao.create).mockResolvedValue(mockMatch as Match);

      const joinResult = service.joinPool(1);
      expect(joinResult.success).toBe(true);

      service.joinPool(2);

      const pair = service.tryFormPair();
      if (pair) {
        const matchPromise = service.createMatch(pair);

        service.joinPool(3);
        expect(service.getPoolSize()).toBe(1);

        await matchPromise;
        expect(mockMatchDao.create).toHaveBeenCalled();
      }
    });
  });
});
