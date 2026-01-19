import { RefreshTokenDao } from '../../../src/auth/src/dao/refresh-token.dao.js';
import { RefreshTokenDaoShape } from '../../../src/auth/src/types/daos/refresh-token.js';
import { CreateRefreshTokenDto } from '../../../src/auth/src/types/dtos/refresh-token.js';
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
    dao = new RefreshTokenDao(mockPrismaClient as any, 7 * 24 * 60 * 60 * 1000); // 7 days in ms
  });
  
  it('Expiration days is set correctly', () => {
    expect((dao as any).expirationMs).toBe(604800000); // 7 days in milliseconds
  });

  it('Should create a refresh token record', async () => {
    const MockCreateRefreshTokenDto: CreateRefreshTokenDto = {
      id: 'some-unique-id',
      user_id: 1,
      hashed_refresh_token: 'token'
    };

    await dao.store(MockCreateRefreshTokenDto);
    expect(mockPrismaClient.refreshToken.create).toBeCalled();
    expect(mockPrismaClient.refreshToken.create).toBeCalledWith({
      data: {
        id: 'some-unique-id',
        user_id: 1,
        hashed_token: 'token',
        expired_at: expect.any(Date)
      }
    });
  });

  it('Should revoke a refresh token', async () => {
    await dao.revoke({ id: 'some-unique-id' });
    expect(mockPrismaClient.refreshToken.update).toBeCalled();
    expect(mockPrismaClient.refreshToken.update).toBeCalledWith({
      where: { id: 'some-unique-id' },
      data: { revoked_at: expect.any(Date) }
    });
  });

  it('Should purge revoked and expired tokens', async () => {
    await dao.purgeRevokedExpired();
    expect(mockPrismaClient.refreshToken.deleteMany).toBeCalled();
    expect(mockPrismaClient.refreshToken.deleteMany).toBeCalledWith({
      where: {
        OR: [
          { revoked_at: { not: null } },
          { expired_at: { lt: expect.any(Date) } }
        ]
      }
    });
  });

  it('Should find a refresh token by token id and return full record', async () => {
    const mockRefreshToken = {
      id: 'some-unique-id',
      user_id: 1,
      hashed_token: 'hashed-token-value',
      expired_at: new Date(),
      revoked_at: null,
      createdAt: new Date()
    };

    mockPrismaClient.refreshToken.findUnique.mockResolvedValueOnce(mockRefreshToken);
    const result = await dao.findById({ id: 'some-unique-id' });
    
    expect(mockPrismaClient.refreshToken.findUnique).toBeCalled();
    expect(mockPrismaClient.refreshToken.findUnique).toBeCalledWith({
      where: { id: 'some-unique-id' }
    });
    expect(result).toEqual(mockRefreshToken);
    expect(result?.hashed_token).toBe('hashed-token-value');
    expect(result?.user_id).toBe(1);
  });

  it('Should return null if token not found', async () => {
    mockPrismaClient.refreshToken.findUnique.mockResolvedValueOnce(null);
    const result = await dao.findById({ id: 'nonexistent' });
    expect(result).toBeNull();
  });

  it('Should handle errors gracefully', async () => {
    mockPrismaClient.refreshToken.create.mockRejectedValueOnce(new Error('DB Error'));
    await expect(dao.store({ id: 'test-id', user_id: 1, refreshToken: 'token' })).rejects.toThrow('DB Error');
  });

  it('Should fail when revoking non-existent token', async () => {
    mockPrismaClient.refreshToken.update.mockRejectedValueOnce(new Error('Token not found'));
    await expect(dao.revoke({ id: 'invalid' })).rejects.toThrow('Token not found');
  });
});