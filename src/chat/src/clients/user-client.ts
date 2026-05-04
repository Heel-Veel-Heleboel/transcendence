import type { FastifyBaseLogger } from 'fastify';

export class UserClient {
  private readonly userManagementUrl: string;

  constructor(private readonly logger: FastifyBaseLogger) {
    this.userManagementUrl = process.env.USER_MANAGEMENT_URL || 'http://localhost:3004';
  }

  async getUsernames(userIds: number[]): Promise<Map<number, string>> {
    const results = new Map<number, string>();
    await Promise.all(
      userIds.map(async (userId) => {
        try {
          const response = await fetch(`${this.userManagementUrl}/users/find-by-id/${userId}`);
          if (response.ok) {
            const user = await response.json() as { id: number; name: string };
            if (user.name) results.set(userId, user.name);
          }
        } catch (error) {
          this.logger.error({ error, userId }, 'Failed to fetch username from user service');
        }
      })
    );
    return results;
  }
}
