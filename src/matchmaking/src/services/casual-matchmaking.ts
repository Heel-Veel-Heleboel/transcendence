import { MatchDao } from '../dao/match.js';
import { PlayerPool } from '../models/player-pool.js';

/**
 * MatchmakingService
 * Manages the casual matchmaking pool (in-memory only)
 *
 * Design: Simple event-driven pairing
 * - joinPool adds players to queue (non-blocking)
 * - Background interval handles pairing (no mutex needed)
 * - All operations are synchronous on the pool (thread-safe in Node.js event loop)
 */
export class MatchmakingService {
  // In-memory pool for fast pairing
  private pool: PlayerPool = new PlayerPool();

  // Pairing interval
  private pairingInterval?: NodeJS.Timeout;

  // Configuration
  private readonly ACK_TIMEOUT_MS: number;
  private readonly MAX_WAIT_TIME_MS: number;
  private readonly PAIRING_INTERVAL_MS: number;

  constructor(
    private readonly matchDao: MatchDao,
    private readonly logger?: any,
    config?: {
      ackTimeoutMs?: number;
      maxWaitTimeMs?: number;
      pairingIntervalMs?: number;
    }
  ) {
    this.ACK_TIMEOUT_MS = config?.ackTimeoutMs ?? 5 * 60 * 1000; // Default: 5 minutes
    this.MAX_WAIT_TIME_MS = config?.maxWaitTimeMs ?? 30 * 60 * 1000; // Default: 30 minutes
    this.PAIRING_INTERVAL_MS = config?.pairingIntervalMs ?? 100; // Default: 100ms
  }

  /**
   * Initialize service - clear pool and start pairing interval
   * Players must rejoin after service restart
   */
  async initialize(): Promise<void> {
    this.log('info', 'Initializing matchmaking service...');
    this.pool.clear();
    this.startPairingInterval();
    this.log('info', `Player pool initialized (pairing every ${this.PAIRING_INTERVAL_MS}ms)`);
  }

  /**
   * Shutdown service - clear interval
   */
  async shutdown(): Promise<void> {
    this.log('info', 'Shutting down matchmaking service...');
    this.stopPairingInterval();
    this.pool.clear();
    this.log('info', 'Matchmaking service shut down');
  }

  /**
   * Start the background pairing interval
   */
  private startPairingInterval(): void {
    if (this.pairingInterval) {
      return; // Already running
    }

    this.pairingInterval = setInterval(() => {
      void this.processPairingQueue();
    }, this.PAIRING_INTERVAL_MS);
  }

  /**
   * Stop the background pairing interval
   */
  private stopPairingInterval(): void {
    if (this.pairingInterval) {
      clearInterval(this.pairingInterval);
      this.pairingInterval = undefined;
    }
  }

  /**
   * Process pairing queue - pair as many players as possible
   * Called by interval timer
   */
  private async processPairingQueue(): Promise<void> {
    while (this.pool.size() >= 2) {
      const oldestPlayers = this.pool.getNOldestPlayers(2);
      if (oldestPlayers.length < 2) {
        break;
      }

      const player1 = oldestPlayers[0];
      const player2 = oldestPlayers[1];

      try {
        const deadline = new Date(Date.now() + this.ACK_TIMEOUT_MS);
        const match = await this.matchDao.create({
          player1Id: player1.userId,
          player2Id: player2.userId,
          deadline
        });

        // Remove both players from pool (they're now in a match)
        this.pool.remove(player1.userId);
        this.pool.remove(player2.userId);

        this.log('info', `Paired users ${player1.userId} and ${player2.userId} (match: ${match.id})`);
      } catch (error) {
        this.log('error', `Failed to create match for users ${player1.userId} and ${player2.userId}`, { error });
        break;
      }
    }
  }

  /**
   * Add a player to the matchmaking pool
   * Pairing happens automatically via background interval
   */
  async joinPool(userId: number): Promise<{ success: boolean; queuePosition: number }> {
    // Check if already in pool
    if (this.pool.inPool(userId)) {
      this.log('warn', `User ${userId} already in pool`);
      return {
        success: false,
        queuePosition: this.getQueuePosition(userId)
      };
    }

    // Add to in-memory pool
    this.pool.addToBack(userId);

    this.log('info', `User ${userId} joined pool (pool size: ${this.pool.size()})`);

    const queuePosition = this.getQueuePosition(userId);

    return {
      success: true,
      queuePosition
    };
  }

  /**
   * Remove a player from the matchmaking pool
   */
  async leavePool(userId: number): Promise<{ success: boolean }> {
    if (!this.pool.inPool(userId)) {
      this.log('warn', `User ${userId} not in pool`);
      return { success: false };
    }

    // Remove from in-memory pool
    this.pool.remove(userId);

    this.log('info', `User ${userId} left pool (pool size: ${this.pool.size()})`);

    return { success: true };
  }

  /**
   * Get pool status for a specific user
   */
  async getPoolStatus(userId: number): Promise<{
    inPool: boolean;
    queuePosition?: number;
    poolSize: number;
    estimatedWaitMs?: number;
  }> {
    const inPool = this.pool.inPool(userId);
    const poolSize = this.pool.size();

    if (!inPool) {
      return { inPool: false, poolSize };
    }

    const queuePosition = this.getQueuePosition(userId);
    const estimatedWaitMs = this.estimateWaitTime(queuePosition);

    return {
      inPool: true,
      queuePosition,
      poolSize,
      estimatedWaitMs
    };
  }

  /**
   * Manually trigger pairing process (for testing or manual triggers)
   * In production, pairing happens automatically via background interval
   */
  async tryAutoPair(): Promise<{ paired: boolean; matchId?: string }> {
    if (this.pool.size() < 2) {
      return { paired: false };
    }

    const oldestPlayers = this.pool.getNOldestPlayers(2);
    if (oldestPlayers.length < 2) {
      return { paired: false };
    }

    const player1 = oldestPlayers[0];
    const player2 = oldestPlayers[1];

    const deadline = new Date(Date.now() + this.ACK_TIMEOUT_MS);
    const match = await this.matchDao.create({
      player1Id: player1.userId,
      player2Id: player2.userId,
      deadline
    });

    // Remove both players from pool (they're now in a match)
    this.pool.remove(player1.userId);
    this.pool.remove(player2.userId);

    this.log('info', `Paired users ${player1.userId} and ${player2.userId} (match: ${match.id})`);

    return {
      paired: true,
      matchId: match.id
    };
  }

  /**
   * Return a player to the pool (called when their opponent failed to acknowledge)
   * Adds player to the FRONT of the queue (priority) for fairness
   */
  async returnToPool(userId: number): Promise<void> {
    // Check if already in pool
    if (this.pool.inPool(userId)) {
      this.log('warn', `User ${userId} already in pool, skipping return`);
      return;
    }

    // Add to front of queue (priority)
    this.pool.addToFront(userId);

    this.log('info', `User ${userId} returned to front of pool (priority)`);
  }

  /**
   * Cleanup stale pool entries (called periodically by scheduler)
   * Removes players who have been waiting longer than max wait time
   */
  async cleanupStaleEntries(): Promise<number> {
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
   * Get queue position for a user (1-indexed)
   * Lower number = closer to being paired (1 = next to be paired)
   */
  private getQueuePosition(userId: number): number {
    return this.pool.getPosition(userId);
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
  private log(level: string, message: string, meta?: any): void {
    if (this.logger) {
      this.logger[level]({ ...meta, service: 'matchmaking' }, message);
    } else {
      console.log(`[${level.toUpperCase()}] ${message}`, meta || '');
    }
  }
}
