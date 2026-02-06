import { MatchDao } from '../dao/match.js';
import { PlayerPool, PlayerPoolEntry } from '../models/player-pool.js';
import { Logger } from '../types/logger.js';

/**
 * Represents a pair of players ready to be matched
 */
export interface PlayerPair {
  player1: PlayerPoolEntry;
  player2: PlayerPoolEntry;
}

/**
 * MatchmakingService
 * Manages the casual matchmaking pool (in-memory only)
 *
 * Design: Sync queue operations, async match creation
 * - joinPool/leavePool are instant (sync pool operations)
 * - Pairing removes players from queue immediately (sync)
 * - Match creation is async but doesn't block queue operations
 * - If match creation fails, players who acked are returned to front of queue
 *
 * All pool operations are synchronous - no race conditions possible
 */
export class MatchmakingService {
  // In-memory pool for fast pairing
  private pool: PlayerPool = new PlayerPool();

  // Configuration
  private readonly ACK_TIMEOUT_MS: number;
  private readonly MAX_WAIT_TIME_MS: number;

  constructor(
    private readonly matchDao: MatchDao,
    gameMode: string,
    private readonly logger?: Logger,
    config?: {
      ackTimeoutMs?: number;
      maxWaitTimeMs?: number;
    }
  ) {
    this.gameMode = gameMode;
    this.ACK_TIMEOUT_MS = config?.ackTimeoutMs ?? 5 * 60 * 1000; // Default: 5 minutes
    this.MAX_WAIT_TIME_MS = config?.maxWaitTimeMs ?? 30 * 60 * 1000; // Default: 30 minutes
  }

  /**
   * Initialize service - clear pool
   * Players must rejoin after service restart
   */
  async initialize(): Promise<void> {
    this.log('info', 'Initializing matchmaking service...');
    this.pool.clear();
    this.log('info', 'Player pool initialized');
  }

  /**
   * Shutdown service - clear pool
   */
  async shutdown(): Promise<void> {
    this.log('info', 'Shutting down matchmaking service...');
    this.pool.clear();
    this.log('info', 'Matchmaking service shut down');
  }

  /**
   * Add a player to the matchmaking pool
   * This is instant - always succeeds unless user already in pool
   */
  joinPool(userId: number): { success: boolean; queuePosition: number } {
    // Check if already in pool
    if (this.pool.inPool(userId)) {
      this.log('warn', `User ${userId} already in pool`);
      return {
        success: false,
        queuePosition: this.pool.getPosition(userId)
      };
    }

    // Add to pool (sync, instant)
    this.pool.addToBack(userId);
    this.log('info', `User ${userId} joined pool (pool size: ${this.pool.size()})`);

    return {
      success: true,
      queuePosition: this.pool.getPosition(userId)
    };
  }

  /**
   * Remove a player from the matchmaking pool
   * This is instant
   */
  leavePool(userId: number): { success: boolean } {
    const removed = this.pool.remove(userId);

    if (!removed) {
      this.log('warn', `User ${userId} not in pool`);
      return { success: false };
    }

    this.log('info', `User ${userId} left pool (pool size: ${this.pool.size()})`);
    return { success: true };
  }

  /**
   * Try to form a pair from the pool
   * Returns the pair if successful, null if not enough players
   * This is a sync operation - removes players from queue immediately
   */
  tryFormPair(): PlayerPair | null {
    if (this.pool.size() < 2) {
      return null;
    }

    const players = this.pool.getNOldestPlayers(2);
    if (players.length < 2) {
      return null;
    }

    // Remove both players from pool (sync)
    this.pool.remove(players[0].userId);
    this.pool.remove(players[1].userId);

    this.log('info', `Formed pair: ${players[0].userId} and ${players[1].userId}`);

    return {
      player1: players[0],
      player2: players[1]
    };
  }

  /**
   * Create a match for a pair of players
   * This is the async DB operation
   * If it fails, caller should use returnToPool for players who acked
   */
  async createMatch(pair: PlayerPair): Promise<{ matchId: string }> {
    const deadline = new Date(Date.now() + this.ACK_TIMEOUT_MS);

    const match = await this.matchDao.create({
      player1Id: player1.userId,
      player2Id: player2.userId,
      gameMode: this.gameMode,
      deadline
    });

    this.log('info', `Created match ${match.id} for users ${pair.player1.userId} and ${pair.player2.userId}`);

    return { matchId: match.id };
  }

  /**
   * Convenience method: try to pair and create match in one call
   * Used for testing and simple use cases
   */
  async tryAutoPair(): Promise<{ paired: boolean; matchId?: string }> {
    const pair = this.tryFormPair();
    if (!pair) {
      return { paired: false };
    }

    try {
      const { matchId } = await this.createMatch(pair);
      return { paired: true, matchId };
    } catch (error) {
      // Return both players to front of pool on failure.
      // Call order preserves original pair ordering in the queue.
      this.pool.addToFront(pair.player2.userId);
      this.pool.addToFront(pair.player1.userId);
      this.log('error', 'Failed to create match, returned players to pool', {
        player1: pair.player1.userId,
        player2: pair.player2.userId,
        error
      });
      throw error;
    }
  }

  /**
   * Return a player to the pool (called when their opponent failed to acknowledge)
   * Adds player to the FRONT of the queue (priority) for fairness
   */
  returnToPool(userId: number): { success: boolean } {
    if (this.pool.inPool(userId)) {
      this.log('warn', `User ${userId} already in pool, skipping return`);
      return { success: false };
    }

    this.pool.addToFront(userId);
    this.log('info', `User ${userId} returned to front of pool (priority)`);

    return { success: true };
  }

  /**
   * Get pool status for a specific user
   */
  getPoolStatus(userId: number): {
    inPool: boolean;
    queuePosition?: number;
    poolSize: number;
    estimatedWaitMs?: number;
  } {
    const inPool = this.pool.inPool(userId);
    const poolSize = this.pool.size();

    if (!inPool) {
      return { inPool: false, poolSize };
    }

    const queuePosition = this.pool.getPosition(userId);
    const estimatedWaitMs = this.estimateWaitTime(queuePosition);

    return {
      inPool: true,
      queuePosition,
      poolSize,
      estimatedWaitMs
    };
  }

  /**
   * Cleanup stale pool entries (called periodically by scheduler)
   * Removes players who have been waiting longer than max wait time
   */
  cleanupStaleEntries(): number {
    const cutoffDate = new Date(Date.now() - this.MAX_WAIT_TIME_MS);
    const removed = this.pool.removeStale(cutoffDate);

    if (removed > 0) {
      this.log('info', `Cleaned up ${removed} stale pool entries`);
    }

    return removed;
  }

  /**
   * Get current pool size
   */
  getPoolSize(): number {
    return this.pool.size();
  }

  /**
   * Check if user is in pool
   */
  isInPool(userId: number): boolean {
    return this.pool.inPool(userId);
  }

  /**
   * Check if there are enough players to form a pair
   */
  canFormPair(): boolean {
    return this.pool.size() >= 2;
  }

  /**
   * Estimate wait time based on queue position
   * Assumes average pairing time of 30 seconds
   */
  private estimateWaitTime(queuePosition: number): number {
    if (queuePosition <= 0) return 0;

    // If odd position, need to wait for one more player to join
    const pairsAhead = Math.floor((queuePosition - 1) / 2);
    const avgPairTimeMs = 30 * 1000; // 30 seconds average

    return pairsAhead * avgPairTimeMs;
  }

  /**
   * Simple logging wrapper
   */
  private log(level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>): void {
    if (this.logger) {
      this.logger[level]({ ...meta, service: 'matchmaking' }, message);
    } else {
      console.log(`[${level.toUpperCase()}] ${message}`, meta || '');
    }
  }
}
