import type { FastifyBaseLogger } from 'fastify';

export class BlockService {
  private readonly userServiceUrl: string;

  constructor(private readonly logger: FastifyBaseLogger) {
    this.userServiceUrl = process.env.USER_MANAGEMENT_URL || 'http://localhost:3004';
  }

  // Returns true if either user has blocked the other (prevents messaging in either direction)
  async isBlocked(userId: number, targetUserId: number): Promise<boolean> {
    try {
      const [blockedByUser, blockedByTarget] = await Promise.all([
        this.isBlockedBy(userId, targetUserId),
        this.isBlockedBy(targetUserId, userId)
      ]);
      return blockedByUser || blockedByTarget;
    } catch (error) {
      this.logger.error({ error, userId, targetUserId }, 'Error checking block status');
      return false;
    }
  }

  // Fails closed: any error other than a clean 404 is treated as blocked for safety.
  private async isBlockedBy(blocker_id: number, target_id: number): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.userServiceUrl}/users/friendship/is-blocked-by/${blocker_id}/${target_id}`
      );

      if (!response.ok) {
        if (response.status === 404) return false;
        this.logger.warn({ status: response.status }, 'Unexpected response checking block status — treating as blocked');
        return true;
      }

      const data = await response.json() as { blocked: boolean };
      return data.blocked;
    } catch (error) {
      this.logger.error({ error, blocker_id, target_id }, 'Error checking block status — treating as blocked');
      return true;
    }
  }

  async getBlockedUserIds(userId: number): Promise<number[]> {
    try {
      const response = await fetch(
        `${this.userServiceUrl}/users/friendship/find-all-by-status-for-user/${userId}/BLOCKED`
      );

      if (!response.ok) return [];

      const data = await response.json() as Array<{ requester_id: number; addressee_id: number }>;
      return data
        .filter((f) => f.requester_id === userId)
        .map((f) => f.addressee_id);
    } catch (error) {
      this.logger.error({ error, userId }, 'Error fetching blocked users');
      return [];
    }
  }
}
