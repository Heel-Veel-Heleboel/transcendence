import { PrismaClient } from '../../generated/prisma/client.js';  
import { CreateRefreshTokenDto, DeleteAllForUser, FindRefreshTokenDto, RevokeRefreshTokenDto } from '../types/dtos/refresh-token.js';
import { RefreshTokenDaoShape } from '../types/daos/refresh-token.js';


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

export class RefreshTokenDao implements RefreshTokenDaoShape {
  constructor(
    private readonly prismaClient: PrismaClient,
    private readonly expirationRefreshToken: number
  ) {};

  async create(data: CreateRefreshTokenDto): Promise<void> {
    await this.prismaClient.refreshToken.create({
      data: {
        userId: data.userId,
        hashedToken: data.refreshToken,
        jti: data.jti,
        expiredAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * this.expirationRefreshToken)
      }
    });
  }

  async revoke(tokenData: RevokeRefreshTokenDto): Promise<void> {
    await this.prismaClient.refreshToken.update({
      where: { id: tokenData.tokenId },
      data: { revokedAt: new Date() }
    });
  }

  async findByTokenId(data: FindRefreshTokenDto): Promise<string | null> {
    const record = await this.prismaClient.refreshToken.findUnique({
      where: { id: data.tokenId }
    });
    return record ? record.hashedToken : null;
  }

  async deleteAllForUser(data: DeleteAllForUser): Promise<void> {
    await this.prismaClient.refreshToken.deleteMany({
      where: { userId: data.userId }
    });
  }

  async deleteAllRevoked(): Promise<void> {
    await this.prismaClient.refreshToken.deleteMany({
      where: { revokedAt: { not: null } }
    });
  }
}
