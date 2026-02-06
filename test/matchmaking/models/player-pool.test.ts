import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlayerPool } from '../../../src/matchmaking/src/models/player-pool.js';

describe('PlayerPool', () => {
  let pool: PlayerPool;

  beforeEach(() => {
    pool = new PlayerPool();
  });

  describe('addToBack()', () => {
    it('should add a player to the back of the queue', () => {
      const entry = pool.addToBack(1);

      expect(entry.userId).toBe(1);
      expect(entry.joinedAt).toBeInstanceOf(Date);
      expect(entry.lastActive).toBeInstanceOf(Date);
      expect(pool.size()).toBe(1);
      expect(pool.inPool(1)).toBe(true);
    });

    it('should maintain FIFO order when adding multiple players', () => {
      pool.addToBack(1);
      pool.addToBack(2);
      pool.addToBack(3);

      const all = pool.getAll();
      expect(all.map(e => e.userId)).toEqual([1, 2, 3]);
      expect(pool.size()).toBe(3);
    });

    it('should throw error when adding duplicate userId', () => {
      pool.addToBack(1);
      expect(() => pool.addToBack(1)).toThrow('User 1 already in pool');
    });
  });

  describe('addToFront()', () => {
    it('should add a player to the front of the queue', () => {
      pool.addToBack(1);
      pool.addToBack(2);
      pool.addToFront(99);

      const all = pool.getAll();
      expect(all.map(e => e.userId)).toEqual([99, 1, 2]);
      expect(pool.size()).toBe(3);
    });

    it('should give priority to players added to front', () => {
      pool.addToBack(1);
      pool.addToBack(2);
      pool.addToBack(3);
      pool.addToFront(100); // Return after failed opponent ack

      const oldest = pool.getNOldestPlayers(2);
      expect(oldest[0].userId).toBe(100); // Priority player first
      expect(oldest[1].userId).toBe(1);   // Original first player second
    });

    it('should throw error when adding duplicate userId to front', () => {
      pool.addToBack(1);
      expect(() => pool.addToFront(1)).toThrow('User 1 already in pool');
    });
  });

  describe('remove()', () => {
    it('should remove a player from the queue', () => {
      pool.addToBack(1);
      pool.addToBack(2);
      pool.addToBack(3);

      const removed = pool.remove(2);

      expect(removed).toBe(true);
      expect(pool.size()).toBe(2);
      expect(pool.inPool(2)).toBe(false);
      expect(pool.getAll().map(e => e.userId)).toEqual([1, 3]);
    });

    it('should return false when removing non-existent player', () => {
      const removed = pool.remove(999);
      expect(removed).toBe(false);
    });

    it('should remove from front correctly', () => {
      pool.addToBack(1);
      pool.addToBack(2);
      pool.addToBack(3);

      pool.remove(1);
      expect(pool.getAll().map(e => e.userId)).toEqual([2, 3]);
    });

    it('should remove from back correctly', () => {
      pool.addToBack(1);
      pool.addToBack(2);
      pool.addToBack(3);

      pool.remove(3);
      expect(pool.getAll().map(e => e.userId)).toEqual([1, 2]);
    });
  });

  describe('get() and inPool()', () => {
    it('should retrieve player entry by userId', () => {
      pool.addToBack(1);
      const entry = pool.get(1);

      expect(entry).toBeDefined();
      expect(entry?.userId).toBe(1);
    });

    it('should return undefined for non-existent player', () => {
      const entry = pool.get(999);
      expect(entry).toBeUndefined();
    });

    it('should check if player is in pool', () => {
      pool.addToBack(1);

      expect(pool.inPool(1)).toBe(true);
      expect(pool.inPool(999)).toBe(false);
    });
  });

  describe('getAll()', () => {
    it('should return all players in queue order', () => {
      pool.addToBack(1);
      pool.addToBack(2);
      pool.addToFront(99);

      const all = pool.getAll();
      expect(all.length).toBe(3);
      expect(all.map(e => e.userId)).toEqual([99, 1, 2]);
    });

    it('should return empty array for empty pool', () => {
      const all = pool.getAll();
      expect(all).toEqual([]);
    });

    it('should return a copy of the queue (not reference)', () => {
      pool.addToBack(1);
      const all1 = pool.getAll();
      pool.addToBack(2);
      const all2 = pool.getAll();

      expect(all1.length).toBe(1);
      expect(all2.length).toBe(2);
    });
  });

  describe('getNOldestPlayers()', () => {
    it('should return first N players from front of queue', () => {
      pool.addToBack(1);
      pool.addToBack(2);
      pool.addToBack(3);
      pool.addToBack(4);

      const oldest = pool.getNOldestPlayers(2);
      expect(oldest.map(e => e.userId)).toEqual([1, 2]);
    });

    it('should return all players if limit exceeds size', () => {
      pool.addToBack(1);
      pool.addToBack(2);

      const oldest = pool.getNOldestPlayers(10);
      expect(oldest.length).toBe(2);
      expect(oldest.map(e => e.userId)).toEqual([1, 2]);
    });

    it('should return empty array for empty pool', () => {
      const oldest = pool.getNOldestPlayers(5);
      expect(oldest).toEqual([]);
    });

    it('should respect priority players added to front', () => {
      pool.addToBack(1);
      pool.addToBack(2);
      pool.addToFront(99);
      pool.addToBack(3);

      const oldest = pool.getNOldestPlayers(2);
      expect(oldest.map(e => e.userId)).toEqual([99, 1]);
    });
  });

  describe('getPosition()', () => {
    it('should return correct 1-indexed position', () => {
      pool.addToBack(1);
      pool.addToBack(2);
      pool.addToBack(3);

      expect(pool.getPosition(1)).toBe(1); // Front
      expect(pool.getPosition(2)).toBe(2); // Middle
      expect(pool.getPosition(3)).toBe(3); // Back
    });

    it('should return -1 for non-existent player', () => {
      pool.addToBack(1);
      expect(pool.getPosition(999)).toBe(-1);
    });

    it('should reflect priority position for players added to front', () => {
      pool.addToBack(1);
      pool.addToBack(2);
      pool.addToFront(99);

      expect(pool.getPosition(99)).toBe(1); // Priority player
      expect(pool.getPosition(1)).toBe(2);  // Pushed back
      expect(pool.getPosition(2)).toBe(3);  // Pushed back
    });
  });

  describe('updateLastActive()', () => {
    it('should update lastActive timestamp', () => {
      vi.useFakeTimers();
      const now = new Date('2026-01-01T00:00:00.000Z');
      vi.setSystemTime(now);

      pool.addToBack(1);
      const entry1 = pool.get(1);
      const originalTime = entry1?.lastActive;

      // Advance time by 1 second
      vi.advanceTimersByTime(1000);

      pool.updateLastActive(1);
      const entry2 = pool.get(1);

      expect(entry2?.lastActive.getTime()).toBeGreaterThan(originalTime!.getTime());
      expect(entry2?.lastActive.getTime()).toBe(now.getTime() + 1000);

      vi.useRealTimers();
    });

    it('should not throw for non-existent player', () => {
      expect(() => pool.updateLastActive(999)).not.toThrow();
    });
  });

  describe('removeStale()', () => {
    it('should remove entries older than cutoff date', () => {
      const now = new Date();
      const old = new Date(now.getTime() - 60000); // 1 minute ago

      pool.addToBack(1);
      pool.addToBack(2);
      pool.addToBack(3);

      // Manually set joinedAt to old date for testing
      const entry1 = pool.get(1);
      const entry2 = pool.get(2);
      if (entry1) entry1.joinedAt = old;
      if (entry2) entry2.joinedAt = old;

      const cutoff = new Date(now.getTime() - 30000); // 30 seconds ago
      const removed = pool.removeStale(cutoff);

      expect(removed).toBe(2);
      expect(pool.size()).toBe(1);
      expect(pool.inPool(3)).toBe(true);
      expect(pool.inPool(1)).toBe(false);
      expect(pool.inPool(2)).toBe(false);
    });

    it('should not remove entries newer than cutoff', () => {
      pool.addToBack(1);
      pool.addToBack(2);
      pool.addToBack(3);

      const cutoff = new Date(Date.now() - 60000); // 1 minute ago
      const removed = pool.removeStale(cutoff);

      expect(removed).toBe(0);
      expect(pool.size()).toBe(3);
    });

    it('should return 0 for empty pool', () => {
      const cutoff = new Date();
      const removed = pool.removeStale(cutoff);
      expect(removed).toBe(0);
    });
  });

  describe('size()', () => {
    it('should return correct pool size', () => {
      expect(pool.size()).toBe(0);

      pool.addToBack(1);
      expect(pool.size()).toBe(1);

      pool.addToBack(2);
      pool.addToBack(3);
      expect(pool.size()).toBe(3);

      pool.remove(2);
      expect(pool.size()).toBe(2);
    });
  });

  describe('clear()', () => {
    it('should remove all entries from pool', () => {
      pool.addToBack(1);
      pool.addToBack(2);
      pool.addToBack(3);

      pool.clear();

      expect(pool.size()).toBe(0);
      expect(pool.getAll()).toEqual([]);
      expect(pool.inPool(1)).toBe(false);
      expect(pool.inPool(2)).toBe(false);
      expect(pool.inPool(3)).toBe(false);
    });

    it('should work on empty pool', () => {
      expect(() => pool.clear()).not.toThrow();
      expect(pool.size()).toBe(0);
    });
  });

  describe('Integration: Priority Queue Behavior', () => {
    it('should handle realistic matchmaking scenario', () => {
      // Normal users join
      pool.addToBack(1);
      pool.addToBack(2);
      pool.addToBack(3);
      pool.addToBack(4);

      // Pair first two (1 and 2)
      const pair1 = pool.getNOldestPlayers(2);
      expect(pair1.map(e => e.userId)).toEqual([1, 2]);
      pool.remove(1);
      pool.remove(2);

      // User 2's opponent failed to ack, return user 2 to front
      pool.addToFront(2);

      // Now pool should be: [2 (priority), 3, 4]
      expect(pool.getAll().map(e => e.userId)).toEqual([2, 3, 4]);

      // Next pairing should be 2 and 3 (2 has priority)
      const pair2 = pool.getNOldestPlayers(2);
      expect(pair2.map(e => e.userId)).toEqual([2, 3]);
    });

    it('should handle multiple priority returns', () => {
      pool.addToBack(1);
      pool.addToBack(2);
      pool.addToBack(3);
      pool.addToBack(4);

      // Both 1 and 2 failed to get matched, return to front
      pool.remove(1);
      pool.remove(2);
      pool.addToFront(2);
      pool.addToFront(1);

      // Pool should be: [1, 2, 3, 4] (both priority, but 1 added last so it's first)
      expect(pool.getAll().map(e => e.userId)).toEqual([1, 2, 3, 4]);
    });
  });
});
