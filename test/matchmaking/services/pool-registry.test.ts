import { PoolRegistry } from '../../../src/matchmaking/src/services/pool-registry.js';
import { describe, expect, it, beforeEach } from 'vitest';

describe('PoolRegistry', () => {
  let registry: PoolRegistry;

  beforeEach(() => {
    registry = new PoolRegistry();
  });

  describe('canJoinPool', () => {
    it('should allow user to join when not in any pool', () => {
      const result = registry.canJoinPool(123, 'classic');
      expect(result).toBe(true);
    });

    it('should allow user to join same pool they are already in (idempotent)', () => {
      registry.registerUser(123, 'classic');
      const result = registry.canJoinPool(123, 'classic');
      expect(result).toBe(true);
    });

    it('should prevent user from joining different pool', () => {
      registry.registerUser(123, 'classic');
      const result = registry.canJoinPool(123, 'powerup');
      expect(result).toBe(false);
    });

    it('should allow different users to join different pools', () => {
      registry.registerUser(123, 'classic');
      const result = registry.canJoinPool(456, 'powerup');
      expect(result).toBe(true);
    });
  });

  describe('getCurrentPool', () => {
    it('should return undefined when user is not in any pool', () => {
      const result = registry.getCurrentPool(123);
      expect(result).toBeUndefined();
    });

    it('should return pool name when user is registered', () => {
      registry.registerUser(123, 'classic');
      const result = registry.getCurrentPool(123);
      expect(result).toBe('classic');
    });

    it('should return correct pool for different users', () => {
      registry.registerUser(123, 'classic');
      registry.registerUser(456, 'powerup');

      expect(registry.getCurrentPool(123)).toBe('classic');
      expect(registry.getCurrentPool(456)).toBe('powerup');
    });
  });

  describe('registerUser', () => {
    it('should register user to a pool', () => {
      registry.registerUser(123, 'classic');

      expect(registry.getCurrentPool(123)).toBe('classic');
      expect(registry.isUserInAnyPool(123)).toBe(true);
    });

    it('should allow overwriting pool registration', () => {
      registry.registerUser(123, 'classic');
      registry.registerUser(123, 'powerup');

      expect(registry.getCurrentPool(123)).toBe('powerup');
    });

    it('should register multiple users to same pool', () => {
      registry.registerUser(123, 'classic');
      registry.registerUser(456, 'classic');

      expect(registry.getUserCountInPool('classic')).toBe(2);
    });
  });

  describe('unregisterUser', () => {
    it('should remove user from registry', () => {
      registry.registerUser(123, 'classic');
      registry.unregisterUser(123);

      expect(registry.getCurrentPool(123)).toBeUndefined();
      expect(registry.isUserInAnyPool(123)).toBe(false);
    });

    it('should handle unregistering user not in any pool', () => {
      // Should not throw
      registry.unregisterUser(999);

      expect(registry.getCurrentPool(999)).toBeUndefined();
    });

    it('should only remove specified user', () => {
      registry.registerUser(123, 'classic');
      registry.registerUser(456, 'classic');

      registry.unregisterUser(123);

      expect(registry.getCurrentPool(123)).toBeUndefined();
      expect(registry.getCurrentPool(456)).toBe('classic');
    });
  });

  describe('isUserInAnyPool', () => {
    it('should return false when user is not in any pool', () => {
      const result = registry.isUserInAnyPool(123);
      expect(result).toBe(false);
    });

    it('should return true when user is registered', () => {
      registry.registerUser(123, 'classic');
      const result = registry.isUserInAnyPool(123);
      expect(result).toBe(true);
    });

    it('should return false after user is unregistered', () => {
      registry.registerUser(123, 'classic');
      registry.unregisterUser(123);

      const result = registry.isUserInAnyPool(123);
      expect(result).toBe(false);
    });
  });

  describe('getAllRegisteredUsers', () => {
    it('should return empty map when no users registered', () => {
      const result = registry.getAllRegisteredUsers();
      expect(result.size).toBe(0);
    });

    it('should return all registered users', () => {
      registry.registerUser(123, 'classic');
      registry.registerUser(456, 'powerup');
      registry.registerUser(789, 'classic');

      const result = registry.getAllRegisteredUsers();

      expect(result.size).toBe(3);
      expect(result.get(123)).toBe('classic');
      expect(result.get(456)).toBe('powerup');
      expect(result.get(789)).toBe('classic');
    });

    it('should return a copy (not reference) of internal map', () => {
      registry.registerUser(123, 'classic');

      const result = registry.getAllRegisteredUsers();
      result.set(456, 'powerup');

      // Original registry should not be affected
      expect(registry.getCurrentPool(456)).toBeUndefined();
      expect(registry.getTotalUserCount()).toBe(1);
    });
  });

  describe('getUserCountInPool', () => {
    it('should return 0 for empty pool', () => {
      const result = registry.getUserCountInPool('classic');
      expect(result).toBe(0);
    });

    it('should count users in specific pool', () => {
      registry.registerUser(123, 'classic');
      registry.registerUser(456, 'classic');
      registry.registerUser(789, 'powerup');

      expect(registry.getUserCountInPool('classic')).toBe(2);
      expect(registry.getUserCountInPool('powerup')).toBe(1);
    });

    it('should update count when users join and leave', () => {
      registry.registerUser(123, 'classic');
      registry.registerUser(456, 'classic');
      expect(registry.getUserCountInPool('classic')).toBe(2);

      registry.unregisterUser(123);
      expect(registry.getUserCountInPool('classic')).toBe(1);

      registry.unregisterUser(456);
      expect(registry.getUserCountInPool('classic')).toBe(0);
    });

    it('should return 0 for non-existent pool', () => {
      registry.registerUser(123, 'classic');
      const result = registry.getUserCountInPool('non-existent');
      expect(result).toBe(0);
    });
  });

  describe('clear', () => {
    it('should remove all registrations', () => {
      registry.registerUser(123, 'classic');
      registry.registerUser(456, 'powerup');
      registry.registerUser(789, 'classic');

      registry.clear();

      expect(registry.getTotalUserCount()).toBe(0);
      expect(registry.getCurrentPool(123)).toBeUndefined();
      expect(registry.getCurrentPool(456)).toBeUndefined();
      expect(registry.getCurrentPool(789)).toBeUndefined();
    });

    it('should work on already empty registry', () => {
      registry.clear();
      expect(registry.getTotalUserCount()).toBe(0);
    });
  });

  describe('getTotalUserCount', () => {
    it('should return 0 for empty registry', () => {
      const result = registry.getTotalUserCount();
      expect(result).toBe(0);
    });

    it('should count all users across all pools', () => {
      registry.registerUser(123, 'classic');
      registry.registerUser(456, 'powerup');
      registry.registerUser(789, 'classic');

      const result = registry.getTotalUserCount();
      expect(result).toBe(3);
    });

    it('should update when users are unregistered', () => {
      registry.registerUser(123, 'classic');
      registry.registerUser(456, 'powerup');
      expect(registry.getTotalUserCount()).toBe(2);

      registry.unregisterUser(123);
      expect(registry.getTotalUserCount()).toBe(1);

      registry.unregisterUser(456);
      expect(registry.getTotalUserCount()).toBe(0);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete join-leave flow', () => {
      // User joins classic pool
      expect(registry.canJoinPool(123, 'classic')).toBe(true);
      registry.registerUser(123, 'classic');
      expect(registry.getCurrentPool(123)).toBe('classic');

      // User tries to join powerup pool (should fail)
      expect(registry.canJoinPool(123, 'powerup')).toBe(false);

      // User leaves classic pool
      registry.unregisterUser(123);
      expect(registry.getCurrentPool(123)).toBeUndefined();

      // User can now join powerup pool
      expect(registry.canJoinPool(123, 'powerup')).toBe(true);
      registry.registerUser(123, 'powerup');
      expect(registry.getCurrentPool(123)).toBe('powerup');
    });

    it('should handle multiple users across multiple pools', () => {
      // Setup
      registry.registerUser(100, 'classic');
      registry.registerUser(101, 'classic');
      registry.registerUser(200, 'powerup');
      registry.registerUser(201, 'powerup');

      // Verify counts
      expect(registry.getUserCountInPool('classic')).toBe(2);
      expect(registry.getUserCountInPool('powerup')).toBe(2);
      expect(registry.getTotalUserCount()).toBe(4);

      // User 100 gets matched and leaves
      registry.unregisterUser(100);
      expect(registry.getUserCountInPool('classic')).toBe(1);
      expect(registry.getTotalUserCount()).toBe(3);

      // User 100 can rejoin different pool
      expect(registry.canJoinPool(100, 'powerup')).toBe(true);
      registry.registerUser(100, 'powerup');
      expect(registry.getUserCountInPool('powerup')).toBe(3);
    });

    it('should prevent cross-pool contamination', () => {
      registry.registerUser(123, 'classic');
      registry.registerUser(456, 'powerup');

      // Users in different pools shouldn't interfere
      expect(registry.canJoinPool(123, 'classic')).toBe(true);
      expect(registry.canJoinPool(123, 'powerup')).toBe(false);
      expect(registry.canJoinPool(456, 'classic')).toBe(false);
      expect(registry.canJoinPool(456, 'powerup')).toBe(true);

      // Unregistering one shouldn't affect the other
      registry.unregisterUser(123);
      expect(registry.getCurrentPool(456)).toBe('powerup');
      expect(registry.getUserCountInPool('powerup')).toBe(1);
    });
  });
});
