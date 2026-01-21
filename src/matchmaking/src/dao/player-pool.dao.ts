import { PrismaClient, PlayerPool } from '../../generated/prisma/index.js';

/**
 * Data Access Object for PlayerPool
 * Handles all database operations for the matchmaking pool
 */
export class PlayerPoolDao {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Add a player to the pool
   */
  async add(userId: number): Promise<PlayerPool> {
    return await this.prisma.playerPool.create({
      data: {
        userId,
        joinedAt: new Date(),
        lastActive: new Date(),
      },
    });
  }

  /**
   * Remove a player from the pool
   */
  async remove(userId: number): Promise<void> {
    await this.prisma.playerPool.delete({
      where: { userId },
    });
  }

  /**
   * Find a player by userId
   */
  async findByUserId(userId: number): Promise<PlayerPool | null> {
    return await this.prisma.playerPool.findUnique({
      where: { userId },
    });
  }

  /**
   * Get all players in the pool, ordered by join time (FIFO)
   */
  async findAll(): Promise<PlayerPool[]> {
    return await this.prisma.playerPool.findMany({
      orderBy: { joinedAt: 'asc' },
    });
  }

  /**
   * Get the oldest N players (for auto-pairing)
   */
  async findOldest(limit: number): Promise<PlayerPool[]> {
    return await this.prisma.playerPool.findMany({
      orderBy: { joinedAt: 'asc' },
      take: limit,
    });
  }

  /**
   * Update the lastActive timestamp for a player
   */
  async updateLastActive(userId: number): Promise<void> {
    await this.prisma.playerPool.update({
      where: { userId },
      data: { lastActive: new Date() },
    });
  }

  /**
   * Remove stale entries (waiting longer than maximum timeout)
   * Players who joined before olderThan are removed
   * This prevents infinite waiting without kicking actively waiting players too early
   * POSSIBLE IMPROVEMENT: use lastActive and periodically check for inactivity of the said player in general
   */
  async removeStale(olderThan: Date): Promise<number> {
    const result = await this.prisma.playerPool.deleteMany({
      where: {
        joinedAt: { lt: olderThan },
      },
    });
    return result.count;
  }

  /**
   * Count total players in pool
   */
  async count(): Promise<number> {
    return await this.prisma.playerPool.count();
  }

  /**
   * Check if a user is in the pool
   */
  async exists(userId: number): Promise<boolean> {
    const player = await this.prisma.playerPool.findUnique({
      where: { userId },
    });
    return player !== null;
  }
}
