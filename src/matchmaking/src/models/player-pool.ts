/**
 * In-memory PlayerPool model
 * No database persistence - if service restarts, players rejoin the queue
 */
export interface PlayerPoolEntry {
  userId: number;
  username: string;
  joinedAt: Date;
  lastActive: Date;
}

/**
 * In-memory PlayerPool implementation using deque (double-ended queue)
 * - New players are added to the back (push)
 * - Players returning after failed opponent ack are added to the front (unshift) - priority
 * - Pairing takes from the front (shift) - FIFO
 * Thread-safe operations handled by MatchmakingService mutex
 */
export class PlayerPool {
  // Deque: array for ordered queue
  private queue: PlayerPoolEntry[] = [];

  // Map for O(1) lookup and duplicate checking
  private userMap: Map<number, PlayerPoolEntry> = new Map();

  /**
   * Add a player to the back of the queue (normal join)
   */
  addToBack(userId: number, username: string): PlayerPoolEntry {
    if (this.userMap.has(userId)) {
      throw new Error(`User ${userId} already in pool`);
    }

    const entry: PlayerPoolEntry = {
      userId,
      username,
      joinedAt: new Date(),
      lastActive: new Date()
    };

    // Add to back of queue
    this.queue.push(entry);
    this.userMap.set(userId, entry);

    return entry;
  }

  /**
   * Add a player to the front of the queue (priority - for returning after failed opponent ack)
   */
  addToFront(userId: number, username: string): PlayerPoolEntry {
    if (this.userMap.has(userId)) {
      throw new Error(`User ${userId} already in pool`);
    }

    const entry: PlayerPoolEntry = {
      userId,
      username,
      joinedAt: new Date(),
      lastActive: new Date()
    };

    // Add to front of queue (priority)
    this.queue.unshift(entry);
    this.userMap.set(userId, entry);

    return entry;
  }

  /**
   * Remove a player from the pool
   */
  remove(userId: number): boolean {
    const entry = this.userMap.get(userId);
    if (!entry) {
      return false;
    }

    // Remove from map
    this.userMap.delete(userId);

    // Remove from queue (find and splice)
    const index = this.queue.findIndex(e => e.userId === userId);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }

    return true;
  }

  /**
   * Get a player by userId
   */
  get(userId: number): PlayerPoolEntry | undefined {
    return this.userMap.get(userId);
  }

  /**
   * Check if player is in the pool
   */
  inPool(userId: number): boolean {
    return this.userMap.has(userId);
  }

  /**
   * Get all players in queue order (front to back)
   */
  getAll(): PlayerPoolEntry[] {
    return [...this.queue];
  }

  /**
   * Get the first N players from the front of the queue (for auto-pairing)
   * Complexity: O(n) where n is the number of players to retrieve
   */
  getNOldestPlayers(n: number): PlayerPoolEntry[] {
    return this.queue.slice(0, n);
  }

  /**
   * Update the lastActive timestamp for a player
   */
  updateLastActive(userId: number): void {
    const entry = this.userMap.get(userId);
    if (entry) {
      entry.lastActive = new Date();
    }
  }

  /**
   * Remove stale entries (older than cutoff date)
   */
  removeStale(cutoffDate: Date): number {
    let removed = 0;

    // Iterate backwards to avoid index issues when splicing
    for (let i = this.queue.length - 1; i >= 0; i--) {
      const entry = this.queue[i];
      if (entry.joinedAt < cutoffDate) {
        this.queue.splice(i, 1);
        this.userMap.delete(entry.userId);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Get pool size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Clear the entire pool
   */
  clear(): void {
    this.queue = [];
    this.userMap.clear();
  }

  /**
   * Get queue position for a user (1-indexed, 1 = front of queue)
   */
  getPosition(userId: number): number {
    const index = this.queue.findIndex(e => e.userId === userId);
    return index === -1 ? -1 : index + 1; // 1-indexed
  }
}
