import { RevokeRefreshTokenDto, CreateRefreshTokenDto, FindRefreshTokenDto, DeleteAllForUser } from './auth.dto.js';

export interface RefreshTokenDaoShape {
  create(data: CreateRefreshTokenDto): Promise<void>;
  revoke(data: RevokeRefreshTokenDto): Promise<void>;
  findByTokenId(data: FindRefreshTokenDto): Promise<string | null>;
  deleteAllForUser(data: DeleteAllForUser): Promise<void>;
  deleteAllRevoked(): Promise<void>;
}
