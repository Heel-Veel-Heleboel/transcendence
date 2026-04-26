import { ITwoFactorAuthDao } from '../types/daos/2fa.js';
import { PrismaClient, TwoFactorAuth } from '../../generated/prisma/client.js';

export class TwoFactorAuthDao implements ITwoFactorAuthDao {
  constructor(private readonly prismaClient: PrismaClient){}



  async create(user_id: number, secret: string): Promise<void> {
    await this.prismaClient.twoFactorAuth.create({
      data: {
        user_id: user_id,
        secret: secret,
        expires_at: new Date(Date.now() + 5 * 60 * 1000)
      }
    });
  }



  async increaseAttempts(user_id: number): Promise<void> {
    await this.prismaClient.twoFactorAuth.update({
      where: { user_id: user_id },
      data: {
        attempts: {
          increment: 1
        }
      }
    });
  }



  async resetAttempts(user_id: number, expiresAt: Date | null = new Date(Date.now() + 5 * 60 * 1000)): Promise<void> {
    await this.prismaClient.twoFactorAuth.update({
      where: { user_id: user_id },
      data: {
        attempts: 0,
        expires_at: expiresAt
      }
    });
  }



  async findByUserId(user_id: number): Promise<TwoFactorAuth | null> {
    return await this.prismaClient.twoFactorAuth.findUnique({
      where: { user_id: user_id }
    });
  }



  async enable(user_id: number): Promise<void> {
    await this.prismaClient.twoFactorAuth.update({
      where: { user_id: user_id },
      data: {
        enabled: true,
        attempts: 0,
        expires_at: null
      }
    });
  }



  async delete(user_id: number): Promise<void> {
    await this.prismaClient.twoFactorAuth.deleteMany({
      where: { user_id: user_id }
    });
  }

  
}