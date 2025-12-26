import { RevokeRefreshTokenDto, CreateRefreshTokenDto, FindRefreshTokenDto, DeleteAllForUser } from './auth.dto.js';

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
export interface RefreshTokenDaoShape {
  create(data: CreateRefreshTokenDto): Promise<void>;
  revoke(data: RevokeRefreshTokenDto): Promise<void>;
  findByTokenId(data: FindRefreshTokenDto): Promise<string | null>;
  deleteAllForUser(data: DeleteAllForUser): Promise<void>;
  deleteAllRevoked(): Promise<void>;
}
