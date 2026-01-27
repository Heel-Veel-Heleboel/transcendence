import { PrismaClient, RefreshToken } from '../../generated/prisma/client.js';
import { CreateRefreshTokenDto, FindRefreshTokenDto, RevokeAllDto, RevokeRefreshTokenDto } from '../types/dtos/refresh-token.js';
import { IRefreshTokenDao } from '../types/daos/refresh-token.js';

/**
 * Data Access Object (DAO) implementation for managing refresh tokens.
 * Implements methods for creating, revoking, finding, and deleting refresh tokens using Prisma ORM.
 * Methods:
 * - create: Creates a new refresh token record.
 * - revoke: Revokes an existing refresh token by its token ID.
 * - findByTokenId: Finds a refresh token by its token ID.
 * - deleteAllForUser: Deletes all refresh tokens associated with a specific user ID.
 * - deleteAllRevoked: Deletes all revoked refresh tokens from the database.
 */

export class RefreshTokenDao implements IRefreshTokenDao {
  constructor(
    private readonly prismaClient: PrismaClient,
    private readonly expirationMs: number
  ) {};

  async store(data: CreateRefreshTokenDto): Promise<void> {
    await this.prismaClient.refreshToken.create({
      data: {
        id: data.id,
        user_id: data.user_id,
        hashed_token: data.hashed_refresh_token,
        expired_at: new Date(Date.now() + this.expirationMs)
      }
    });
  }

  async revoke(tokenData: RevokeRefreshTokenDto): Promise<void> {
    await this.prismaClient.refreshToken.update({
      where: { id: tokenData.id },
      data: { revoked_at: new Date() }
    });
  }

  async revokeAllByUserId(tokenData: RevokeAllDto): Promise<void> {
    await this.prismaClient.refreshToken.updateMany({
      where: { user_id: tokenData.user_id },
      data: { revoked_at: new Date() }
    });
  }

  async findById(data: FindRefreshTokenDto): Promise<RefreshToken | null> {
    const record = await this.prismaClient.refreshToken.findUnique({
      where: { id: data.id }
    });
    return record;
  }

  async purgeRevokedExpired(): Promise<void> {
    const now = new Date();
    await this.prismaClient.refreshToken.deleteMany({
      where: {
        OR: [
          { revoked_at: { not: null } },
          { expired_at: { lt: now } }
        ]
      }
    });
  }
}
  