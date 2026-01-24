import { RefreshToken } from '../../../generated/prisma/client.js';
import { RevokeRefreshTokenDto, CreateRefreshTokenDto, FindRefreshTokenDto, RevokeAllDto } from '../dtos/refresh-token.js';

/**
 * Data Access Object (DAO) interface for managing refresh tokens.
 * Defines methods for creating, revoking, finding, and deleting refresh tokens.
 * Methods:
 * - create: Creates a new refresh token record.
 * - revoke: Revokes an existing refresh token by its token ID.
 * - findByTokenId: Finds a refresh token by its token ID.
 * - deleteAllForUser: Deletes all refresh tokens associated with a specific user ID.
 * - deleteAllRevoked: Deletes all revoked refresh tokens from the database.
 */
export interface IRefreshTokenDao {
  store(data: CreateRefreshTokenDto): Promise<void>;
  revoke(data: RevokeRefreshTokenDto): Promise<void>;
  revokeAllByUserId(data: RevokeAllDto): Promise<void>;
  findById(data: FindRefreshTokenDto): Promise<RefreshToken | null>;
  purgeRevokedExpired(): Promise<void>;
}