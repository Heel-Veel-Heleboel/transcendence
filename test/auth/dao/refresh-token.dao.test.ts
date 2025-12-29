import { RefreshTokenDao } from '../../../src/auth/src/dao/refresh-token.dao.js';
import { RefreshTokenDaoShape } from '../../../src/auth/src/types/daos/refresh-token.js';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockPrismaClient = {
  refreshToken: {
    create: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
    deleteMany: vi.fn()
  }
};

describe('RefreshTokenSessionDao', () => {
  let dao: RefreshTokenDaoShape;
  beforeEach(() => {
    vi.clearAllMocks();
    dao = new RefreshTokenDao(mockPrismaClient as any, 7);
  });
  
  it('Expiration days is set correctly', () => {
    expect((dao as any).expirationRefreshToken).toBe(7);
  });

  it('Should create a refresh token record ', async () => {
    await dao.create({ userId: 1, refreshToken: 'token', jti: 'test-jti' });
    expect(mockPrismaClient.refreshToken.create).toBeCalled();
    expect(mockPrismaClient.refreshToken.create).toBeCalledWith({
      data: {
        userId: 1,
        hashedToken: 'token',
        expiredAt: expect.any(Date),
        jti: 'test-jti'
      }
    });
  });

  it('Should revoke a refresh token', async () => {
    await dao.revoke({ tokenId: 'fsfsg' });
    expect(mockPrismaClient.refreshToken.update).toBeCalled();
    expect(mockPrismaClient.refreshToken.update).toBeCalledWith({
      where: { id: 'fsfsg' },
      data: { revokedAt: expect.any(Date) }
    });
  });

  it('Should find a refresh token by token id', async () => {
    mockPrismaClient.refreshToken.findUnique.mockResolvedValueOnce({ hashedToken: 'token' });
    const result = await dao.findByTokenId({ tokenId: 'gjhgbuy' });
    expect(mockPrismaClient.refreshToken.findUnique).toBeCalled();
    expect(mockPrismaClient.refreshToken.findUnique).toBeCalledWith({
      where: { id: 'gjhgbuy' }
    });
    expect(result).toBe('token');
  });

  it('Should delete all refresh tokens for a user', async () => {
    await dao.deleteAllForUser({ userId: 1 });
    expect(mockPrismaClient.refreshToken.deleteMany).toBeCalled();
    expect(mockPrismaClient.refreshToken.deleteMany).toBeCalledWith({
      where: { userId: 1 }
    });
  });

  it('Should delete all revoked refresh tokens', async () => {
    await dao.deleteAllRevoked();
    expect(mockPrismaClient.refreshToken.deleteMany).toBeCalled();
    expect(mockPrismaClient.refreshToken.deleteMany).toBeCalledWith({
      where: { revokedAt: { not: null } }
    });
  });

  it('Should return null if token not found', async () => {
    mockPrismaClient.refreshToken.findUnique.mockResolvedValueOnce(null);
    const result = await dao.findByTokenId({ tokenId: 'nonexistent' });
    expect(result).toBeNull();
  });

  it('Should handle errors gracefully', async () => {
    mockPrismaClient.refreshToken.create.mockRejectedValueOnce(new Error('DB Error'));
    await expect(dao.create({ userId: 1, refreshToken: 'token', jti: 'test-jti' })).rejects.toThrow('DB Error');
  });

  it('Should fail when revoking non-existent token', async () => {
    mockPrismaClient.refreshToken.update.mockRejectedValueOnce(new Error('Token not found'));
    await expect(dao.revoke({ tokenId: 'invalid' })).rejects.toThrow('Token not found');
  });

  it('Should handle no tokens to delete when deleting all revoked', async () => {
    mockPrismaClient.refreshToken.deleteMany.mockResolvedValueOnce({ count: 0 });
    await expect(dao.deleteAllRevoked()).resolves.not.toThrow();
  });
});