import { PrismaClient } from '../../generated/prisma/client.js';  
import { CreateRefreshTokenDto, DeleteAllForUser, FindRefreshTokenDto, RevokeRefreshTokenDto } from './auth.dto.js';
import { RefreshTokenDaoShape } from './refresh-token-contract.js';


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
        expiredAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * this.expirationRefreshToken),
        revokedAt: null
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
};