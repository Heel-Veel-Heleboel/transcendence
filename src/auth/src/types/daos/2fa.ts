
import { TwoFactorAuth } from '../../../generated/prisma/client.js';

export interface ITwoFactorAuthDao {
  create(user_id: number, secret: string): Promise<void>;
  delete(user_id: number): Promise<void>;
  enable(user_id: number): Promise<void>;
  increaseAttempts(user_id: number): Promise<void>;
  resetAttempts(user_id: number, expiresAt?: Date | null): Promise<void>;
  findByUserId(user_id: number): Promise<TwoFactorAuth | null>;
}