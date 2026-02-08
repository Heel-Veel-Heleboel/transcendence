/**
 * PoolRegistry
 * Coordinates across multiple matchmaking pools to ensure users only join one queue at a time
 *
 * Design: Simple in-memory registry tracking which pool each user is in
 * - Prevents users from joining multiple queues simultaneously
 * - Provides clear error messages when user tries to join while already queued
 */
export class PoolRegistry {
  // Track which pool each user is currently in
  private userToPool: Map<number, string> = new Map();

  /**
   * Check if a user can join a specific pool
   * Returns true if:
   * - User is not in any pool
   * - User is already in this specific pool (idempotent)
   */
  canJoinPool(userId: number, poolName: string): boolean {
    const currentPool = this.userToPool.get(userId);
    return !currentPool || currentPool === poolName;
  }

  /**
   * Get which pool a user is currently in (if any)
   * Returns undefined if user is not in any pool
   */
  getCurrentPool(userId: number): string | undefined {
    return this.userToPool.get(userId);
  }

  /**
   * Register that a user has joined a pool
   * Should be called after successful joinPool operation
   */
  registerUser(userId: number, poolName: string): void {
    this.userToPool.set(userId, poolName);
  }

  /**
   * Unregister a user from their current pool
   * Should be called after successful leavePool or when matched
   */
  unregisterUser(userId: number): void {
    this.userToPool.delete(userId);
  }

  /**
   * Check if a user is in any pool
   */
  isUserInAnyPool(userId: number): boolean {
    return this.userToPool.has(userId);
  }

  /**
   * Get all users currently in pools
   * Useful for debugging and metrics
   */
  getAllRegisteredUsers(): Map<number, string> {
    return new Map(this.userToPool);
  }

  /**
   * Get count of users in a specific pool
   */
  getUserCountInPool(poolName: string): number {
    let count = 0;
    for (const pool of this.userToPool.values()) {
      if (pool === poolName) {
        count++;
      }
    }
    return count;
  }

  /**
   * Clear all registrations (for testing or service restart)
   */
  clear(): void {
    this.userToPool.clear();
  }

  /**
   * Get total number of users across all pools
   */
  getTotalUserCount(): number {
    return this.userToPool.size;
  }
}
