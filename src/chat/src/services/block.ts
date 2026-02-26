export class BlockService {
  private readonly userServiceUrl: string;

  constructor(
    private readonly logger?: { info: Function; error: Function; warn: Function }
  ) {
    this.userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
  }

  async isBlocked(userId: number, targetUserId: number): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.userServiceUrl}/user/friendships/${userId}/${targetUserId}`
      );

      if (!response.ok) {
        if (response.status === 404) return false;
        this.logger?.warn({ status: response.status }, 'Failed to check block status');
        return false;
      }

      const data = await response.json() as { status: string };
      return data.status === 'BLOCKED';
    } catch (error) {
      this.logger?.error({ error, userId, targetUserId }, 'Error checking block status');
      return false;
    }
  }

  async getBlockedUserIds(userId: number): Promise<number[]> {
    try {
      const response = await fetch(
        `${this.userServiceUrl}/user/friendships/${userId}/blocked`
      );

      if (!response.ok) return [];

      const data = await response.json() as { blockedIds: number[] };
      return data.blockedIds ?? [];
    } catch (error) {
      this.logger?.error({ error, userId }, 'Error fetching blocked users');
      return [];
    }
  }
}
