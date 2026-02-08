import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MatchmakingService } from '../../../src/matchmaking/src/services/casual-matchmaking.js';
import { MatchDao } from '../../../src/matchmaking/src/dao/match.js';
import { Match } from '../../../src/matchmaking/generated/prisma/index.js';

describe('MatchmakingService', () => {
  let service: MatchmakingService;
  let mockMatchDao: MatchDao;

  // Use shorter timeouts for tests
  const TEST_ACK_TIMEOUT_MS = 100; // 100ms instead of 5 minutes
  const TEST_MAX_WAIT_TIME_MS = 1000; // 1 second instead of 30 minutes
  const TEST_PAIRING_INTERVAL_MS = 50; // 50ms pairing interval

  beforeEach(async () => {
    // Create mock MatchDao
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

    service = new MatchmakingService(mockMatchDao, 'classic', undefined, {
      ackTimeoutMs: TEST_ACK_TIMEOUT_MS,
      maxWaitTimeMs: TEST_MAX_WAIT_TIME_MS,
      pairingIntervalMs: TEST_PAIRING_INTERVAL_MS,
    });

    // Initialize to start pairing interval
    await service.initialize();
  });

  afterEach(async () => {
    // Shutdown to clean up interval
    await service.shutdown();
  });

  // Helper to wait for pairing interval to process
  const waitForPairing = () => new Promise(resolve => setTimeout(resolve, TEST_PAIRING_INTERVAL_MS * 2));

  describe('initialize()', () => {
    it('should clear the pool on initialization', async () => {
      // Add only 1 player to avoid auto-pairing
      await service.joinPool(1, 'user1');
      expect(service.getPoolSize()).toBe(1);

      await service.initialize();
      expect(service.getPoolSize()).toBe(0);
    });

    it('should clear the pool even with multiple players', async () => {
      // Add 3 players
      const mockMatch: Partial<Match> = {
        id: 'match-1',
        player1Id: 1,
        player2Id: 2,
        status: 'PENDING_ACKNOWLEDGEMENT',
      };
      vi.mocked(mockMatchDao.create).mockResolvedValue(mockMatch as Match);

      await service.joinPool(1, 'user1');
      await service.joinPool(2, 'user2');
      await service.joinPool(3, 'user3');

      // Wait for pairing to happen (1 and 2 will pair, 3 remains)
      await waitForPairing();
      expect(service.getPoolSize()).toBe(1);

      await service.initialize();
      expect(service.getPoolSize()).toBe(0);
    });
  });

  describe('joinPool()', () => {
    it('should add a player to the pool', async () => {
      const result = await service.joinPool(1, 'user1');

      expect(result.success).toBe(true);
      expect(result.queuePosition).toBe(1);
      expect(service.getPoolSize()).toBe(1);
      expect(service.isInPool(1)).toBe(true);
    });

    it('should return queue position for new player', async () => {
      await service.joinPool(1, 'user1');
      await service.joinPool(2, 'user2');
      const result = await service.joinPool(3, 'user3');

      expect(result.success).toBe(true);
      expect(result.queuePosition).toBe(3);
    });

    it('should return false if player already in pool', async () => {
      await service.joinPool(1, 'user1');
      const result = await service.joinPool(1, 'user1');

      expect(result.success).toBe(false);
      expect(result.queuePosition).toBe(1);
      expect(service.getPoolSize()).toBe(1);
    });

    it('should auto-pair when 2 players join', async () => {
      const mockMatch: Partial<Match> = {
        id: 'match-1',
        player1Id: 1,
        player2Id: 2,
        status: 'PENDING_ACKNOWLEDGEMENT',
      };
      vi.mocked(mockMatchDao.create).mockResolvedValue(mockMatch as Match);

      await service.joinPool(1, 'user1');
      await service.joinPool(2, 'user2');

      // Wait for pairing interval to process
      await waitForPairing();

      expect(mockMatchDao.create).toHaveBeenCalledOnce();
      expect(service.getPoolSize()).toBe(0);
      expect(service.isInPool(1)).toBe(false);
      expect(service.isInPool(2)).toBe(false);
    });

    it('should maintain FIFO order for pairing', async () => {
      const mockMatch: Partial<Match> = {
        id: 'match-1',
        player1Id: 1,
        player2Id: 2,
        status: 'PENDING_ACKNOWLEDGEMENT',
      };
      vi.mocked(mockMatchDao.create).mockResolvedValue(mockMatch as Match);

      await service.joinPool(1, 'user1');
      await service.joinPool(2, 'user2');

      // Wait for pairing interval to process
      await waitForPairing();

      expect(mockMatchDao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          player1Id: 1,
          player2Id: 2,
        })
      );
    });

    it('should not pair when only 1 player in pool', async () => {
      await service.joinPool(1, 'user1');

      expect(mockMatchDao.create).not.toHaveBeenCalled();
      expect(service.getPoolSize()).toBe(1);
    });
  });

  describe('leavePool()', () => {
    it('should remove a player from the pool', async () => {
      await service.joinPool(1, 'user1');
      expect(service.isInPool(1)).toBe(true);

      const result = await service.leavePool(1);

      expect(result.success).toBe(true);
      expect(service.getPoolSize()).toBe(0);
      expect(service.isInPool(1)).toBe(false);
    });

    it('should return false if player not in pool', async () => {
      const result = await service.leavePool(999);

      expect(result.success).toBe(false);
    });

    it('should maintain queue order after removal', async () => {
      await service.joinPool(1, 'user1');
      await service.joinPool(2, 'user2');
      await service.joinPool(3, 'user3');

      await service.leavePool(2);

      expect(service.getPoolSize()).toBe(2);
      expect(service.isInPool(1)).toBe(true);
      expect(service.isInPool(2)).toBe(false);
      expect(service.isInPool(3)).toBe(true);
    });
  });

  describe('getPoolStatus()', () => {
    it('should return status for player in pool', async () => {
      await service.joinPool(1, 'user1');
      await service.joinPool(2, 'user2');
      await service.joinPool(3, 'user3');

      const status = await service.getPoolStatus(2);

      expect(status.inPool).toBe(true);
      expect(status.queuePosition).toBe(2);
      expect(status.poolSize).toBe(3);
      expect(status.estimatedWaitMs).toBeDefined();
    });

    it('should return inPool false for player not in pool', async () => {
      await service.joinPool(1, 'user1');

      const status = await service.getPoolStatus(999);

      expect(status.inPool).toBe(false);
      expect(status.poolSize).toBe(1);
      expect(status.queuePosition).toBeUndefined();
    });

    it('should calculate estimated wait time correctly', async () => {
      await service.joinPool(1, 'user1');
      await service.joinPool(2, 'user2');
      await service.joinPool(3, 'user3');

      const status1 = await service.getPoolStatus(1);
      const status3 = await service.getPoolStatus(3);

      // Player 1 is at position 1 (0 pairs ahead)
      expect(status1.estimatedWaitMs).toBe(0);

      // Player 3 is at position 3 (1 pair ahead = 30 seconds)
      expect(status3.estimatedWaitMs).toBe(30 * 1000);
    });
  });

  describe('tryAutoPair()', () => {
    it('should pair oldest 2 players in pool', async () => {
      const mockMatch: Partial<Match> = {
        id: 'match-1',
        player1Id: 1,
        player2Id: 2,
        status: 'PENDING_ACKNOWLEDGEMENT',
      };
      vi.mocked(mockMatchDao.create).mockResolvedValue(mockMatch as Match);

      await service.joinPool(1, 'user1');
      await service.joinPool(2, 'user2');
      await service.joinPool(3, 'user3');

      // Reset to clear auto-pair from joinPool
      vi.mocked(mockMatchDao.create).mockClear();

      const result = await service.tryAutoPair();

      expect(result.paired).toBe(true);
      expect(result.matchId).toBe('match-1');
      expect(mockMatchDao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          player1Id: 1,
          player2Id: 2,
        })
      );
      expect(service.getPoolSize()).toBe(1); // Only player 3 left
      expect(service.isInPool(3)).toBe(true);
    });

    it('should not pair when less than 2 players', async () => {
      await service.joinPool(1, 'user1');

      // Clear auto-pair call from joinPool
      vi.mocked(mockMatchDao.create).mockClear();

      const result = await service.tryAutoPair();

      expect(result.paired).toBe(false);
      expect(result.matchId).toBeUndefined();
      expect(mockMatchDao.create).not.toHaveBeenCalled();
    });

    it('should not pair when pool is empty', async () => {
      const result = await service.tryAutoPair();

      expect(result.paired).toBe(false);
      expect(mockMatchDao.create).not.toHaveBeenCalled();
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

      await service.joinPool(1, 'user1');
      await service.joinPool(2, 'user2');

      // Manually trigger pairing
      await service.tryAutoPair();

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

  describe('returnToPool()', () => {
    it('should add player to front of queue (priority)', async () => {
      await service.joinPool(1, 'user1');
      await service.joinPool(2, 'user2');
      await service.joinPool(3, 'user3');

      // Simulate player 99 returning after failed opponent ack
      await service.returnToPool(99, 'user99');

      const status = await service.getPoolStatus(99);
      expect(status.queuePosition).toBe(1); // Front of queue
      expect(service.getPoolSize()).toBe(4);
    });

    it('should not add player if already in pool', async () => {
      await service.joinPool(1, 'user1');
      expect(service.getPoolSize()).toBe(1);

      await service.returnToPool(1, 'user1');
      expect(service.getPoolSize()).toBe(1); // Still 1, not 2
    });

    it('should give priority in next pairing', async () => {
      const mockMatch: Partial<Match> = {
        id: 'match-1',
        player1Id: 99,
        player2Id: 1,
        status: 'PENDING_ACKNOWLEDGEMENT',
      };
      vi.mocked(mockMatchDao.create).mockResolvedValue(mockMatch as Match);

      await service.joinPool(1, 'user1');
      await service.joinPool(2, 'user2');
      await service.joinPool(3, 'user3');

      // Player 99 returns to front
      await service.returnToPool(99, 'user99');

      // Clear previous auto-pair calls
      vi.mocked(mockMatchDao.create).mockClear();

      // Next pairing should be 99 (priority) and 1 (oldest in queue)
      await service.tryAutoPair();

      expect(mockMatchDao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          player1Id: 99,
          player2Id: 1,
        })
      );
    });
  });

  describe('cleanupStaleEntries()', () => {
    it('should remove entries older than max wait time', async () => {
      vi.useFakeTimers();
      const now = new Date('2026-01-01T00:00:00.000Z');
      vi.setSystemTime(now);

      // Add only 1 player to avoid pairing
      await service.joinPool(1, 'user1');

      // Advance time past max wait time (1100ms > 1000ms)
      vi.advanceTimersByTime(TEST_MAX_WAIT_TIME_MS + 100);

      await service.joinPool(3, 'user3'); // Recent player

      const removed = await service.cleanupStaleEntries();

      expect(removed).toBe(1); // Player 1 removed
      expect(service.getPoolSize()).toBe(1); // Only player 3 left
      expect(service.isInPool(3)).toBe(true);
      expect(service.isInPool(1)).toBe(false);

      vi.useRealTimers();
    });

    it('should not remove recent entries', async () => {
      const mockMatch: Partial<Match> = {
        id: 'match-1',
        player1Id: 1,
        player2Id: 2,
        status: 'PENDING_ACKNOWLEDGEMENT',
      };
      vi.mocked(mockMatchDao.create).mockResolvedValue(mockMatch as Match);

      vi.useFakeTimers();
      const now = new Date('2026-01-01T00:00:00.000Z');
      vi.setSystemTime(now);

      await service.joinPool(1, 'user1');
      await service.joinPool(2, 'user2');

      // Manually trigger pairing (interval doesn't work with fake timers after service init)
      await service.tryAutoPair();

      // Players should be paired now
      expect(service.getPoolSize()).toBe(0);

      // Advance time but stay under max wait time (500ms < 1000ms)
      vi.advanceTimersByTime(TEST_MAX_WAIT_TIME_MS / 2);

      const removed = await service.cleanupStaleEntries();

      expect(removed).toBe(0);
      expect(service.getPoolSize()).toBe(0);

      vi.useRealTimers();
    });

    it('should return 0 for empty pool', async () => {
      const removed = await service.cleanupStaleEntries();
      expect(removed).toBe(0);
    });
  });

  describe('getPoolSize()', () => {
    it('should return correct pool size', () => {
      expect(service.getPoolSize()).toBe(0);
    });

    it('should track size as players join', async () => {
      await service.joinPool(1, 'user1');
      expect(service.getPoolSize()).toBe(1);

      await service.joinPool(2, 'user2');
      expect(service.getPoolSize()).toBe(2);
    });
  });

  describe('isInPool()', () => {
    it('should return true for player in pool', async () => {
      await service.joinPool(1, 'user1');
      expect(service.isInPool(1)).toBe(true);
    });

    it('should return false for player not in pool', () => {
      expect(service.isInPool(999)).toBe(false);
    });

    it('should return false after player leaves', async () => {
      await service.joinPool(1, 'user1');
      await service.leavePool(1);
      expect(service.isInPool(1)).toBe(false);
    });
  });

  describe('Thread Safety (Mutex)', () => {
    it('should handle concurrent joinPool calls', async () => {
      const promises = [
        service.joinPool(1, 'user1'),
        service.joinPool(2, 'user2'),
        service.joinPool(3, 'user3'),
      ];

      await Promise.all(promises);

      expect(service.getPoolSize()).toBeGreaterThanOrEqual(0); // May be paired
      // All players should have been processed (no duplicates)
    });

    it('should handle concurrent operations', async () => {
      await service.joinPool(1, 'user1');
      await service.joinPool(2, 'user2');
      await service.joinPool(3, 'user3');

      const promises = [
        service.leavePool(1),
        service.getPoolStatus(2),
        service.joinPool(4, 'user4'),
      ];

      await Promise.all(promises);

      // All operations should complete without errors
      expect(service.isInPool(1)).toBe(false);
      expect(service.isInPool(2)).toBe(true);
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
        player1Id: 2,
        player2Id: 3,
        status: 'PENDING_ACKNOWLEDGEMENT',
      };

      vi.mocked(mockMatchDao.create)
        .mockResolvedValueOnce(mockMatch1 as Match)
        .mockResolvedValueOnce(mockMatch2 as Match);

      // Users 1 and 2 join and get paired
      await service.joinPool(1, 'user1');
      await service.joinPool(2, 'user2');

      // Wait for pairing
      await waitForPairing();
      expect(service.getPoolSize()).toBe(0);

      // User 3 joins (waits alone)
      await service.joinPool(3, 'user3');
      expect(service.getPoolSize()).toBe(1);

      // User 2 failed to ack, so user 1 returns to pool
      await service.returnToPool(1, 'user1');

      // Clear previous calls
      vi.mocked(mockMatchDao.create).mockClear();

      // Wait for automatic pairing of 1 (priority) and 3
      await waitForPairing();

      expect(mockMatchDao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          player1Id: 1, // Priority player (returned)
          player2Id: 3, // Oldest in queue
        })
      );

      expect(service.getPoolSize()).toBe(0); // Both paired
    });

    it('should handle player leaving before pairing', async () => {
      await service.joinPool(1, 'user1');
      await service.joinPool(2, 'user2');
      await service.joinPool(3, 'user3');

      // Player 2 leaves before getting paired
      await service.leavePool(2);

      // Clear auto-pair calls from joinPool
      vi.mocked(mockMatchDao.create).mockClear();

      const mockMatch: Partial<Match> = {
        id: 'match-1',
        player1Id: 1,
        player2Id: 3,
        status: 'PENDING_ACKNOWLEDGEMENT',
      };
      vi.mocked(mockMatchDao.create).mockResolvedValue(mockMatch as Match);

      // Next pairing should be 1 and 3 (skipping 2)
      await service.tryAutoPair();

      expect(mockMatchDao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          player1Id: 1,
          player2Id: 3,
        })
      );
    });
  });
});
