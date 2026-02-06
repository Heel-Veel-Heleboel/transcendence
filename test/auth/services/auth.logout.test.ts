import { expect, it, describe, beforeEach, afterEach, vi } from 'vitest';
import { REFRESH_TOKEN_SIZE } from '../../../src/auth/src/constants/jwt.js';

// Mock the crypto comparator to avoid length issues
vi.mock('../../../src/auth/src/utils/jwt.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/auth/src/utils/jwt.js')>();
  return {
    ...actual,
    compareRefreshToken: vi.fn()
  };
});

import { compareRefreshToken } from '../../../src/auth/src/utils/jwt.js';
import { AuthService } from '../../../src/auth/src/services/auth';

const mockUserService = { findUserByEmail: vi.fn() };
const mockCredentialsDao = { findByUserId: vi.fn() };
const mockRefreshTokenDao = {
  store: vi.fn(),
  findByUserId: vi.fn(),
  findById: vi.fn(),
  revoke: vi.fn()
};

describe('AuthService - logout', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService(
      mockUserService as any,
      mockCredentialsDao as any,
      mockRefreshTokenDao as any
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('Should successfully logout with valid refresh token', async () => {
    (compareRefreshToken as unknown as vi.Mock).mockReturnValueOnce(true);
    const tokenId = '550e8400-e29b-41d4-a716-446655440000';
    const tokenPart = 'a'.repeat(REFRESH_TOKEN_SIZE * 2);
    const refreshToken = `${tokenId}.${tokenPart}`;
    
    mockRefreshTokenDao.findById.mockResolvedValueOnce({
      id: tokenId,
      user_id: 1,
      hashed_token: 'a'.repeat(64),
      expired_at: new Date(Date.now() + 86400000)
    });

    await expect(authService.logout({ user_id: 1 }, refreshToken)).resolves.toBeUndefined();
    expect(mockRefreshTokenDao.revoke).toHaveBeenCalledWith({ id: tokenId });
  });

  it('Should throw error when token jti is not found in database', async () => {
    const tokenId = '123e4567-e89b-42d3-a456-426614174000';
    const tokenPart = 'b'.repeat(REFRESH_TOKEN_SIZE * 2);
    const refreshToken = `${tokenId}.${tokenPart}`;
    mockRefreshTokenDao.findById.mockResolvedValueOnce(null);

    await expect(authService.logout({ user_id: 1 }, refreshToken))
      .rejects.toThrow('Invalid refresh token.');
    expect(compareRefreshToken).not.toHaveBeenCalled();
  });

  it('Should throw error when userId does not match token owner', async () => {
    (compareRefreshToken as unknown as vi.Mock).mockReturnValueOnce(true);
    const tokenId = '9f3d5e8c-4b2a-41d7-8e3f-2a5c6d7e8f9a';
    const tokenPart = 'c'.repeat(REFRESH_TOKEN_SIZE * 2);
    const refreshToken = `${tokenId}.${tokenPart}`;
    mockRefreshTokenDao.findById.mockResolvedValueOnce({
      id: tokenId,
      user_id: 2,
      hashed_token: 'c'.repeat(64),
      expired_at: new Date(Date.now() + 86400000)
    });

    await expect(authService.logout({ user_id: 1 }, refreshToken))
      .rejects.toThrow('User ID does not match token owner.');
    expect(mockRefreshTokenDao.revoke).not.toHaveBeenCalled();
  });

  it('Should throw error for invalid refresh token format', async () => {
    await expect(authService.logout({ user_id: 1 }, 'invalidtoken'))
      .rejects.toThrow('Invalid refresh token format.');
    expect(mockRefreshTokenDao.findById).not.toHaveBeenCalled();
  });

  it('Should throw error when refresh token is empty', async () => {
    await expect(authService.logout({ user_id: 1 }, ''))
      .rejects.toThrow('Invalid refresh token format.');
  });

  it('Should throw error when refresh token is malformed', async () => {
    await expect(authService.logout({ user_id: 1 }, '.'))
      .rejects.toThrow('Invalid refresh token format.');
  });

  it('Should call revoke method after successful logout', async () => {
    (compareRefreshToken as unknown as vi.Mock).mockReturnValueOnce(true);
    const tokenId = '7a8b9c0d-1e2f-4a4b-9c6d-7e8f9a0b1c2d';
    const tokenPart = 'd'.repeat(REFRESH_TOKEN_SIZE * 2);
    const refreshToken = `${tokenId}.${tokenPart}`;
    
    mockRefreshTokenDao.findById.mockResolvedValueOnce({
      id: tokenId,
      user_id: 1,
      hashed_token: 'd'.repeat(64),
      expired_at: new Date(Date.now() + 86400000)
    });

    await authService.logout({ user_id: 1 }, refreshToken);
    expect(mockRefreshTokenDao.revoke).toHaveBeenCalledWith({ id: tokenId });
  });

  it('Should throw error when refresh token does not match stored hash', async () => {
    (compareRefreshToken as unknown as vi.Mock).mockReturnValueOnce(false);
    const tokenId = '3c4d5e6f-7a8b-4c0d-9e2f-3a4b5c6d7e8f';
    const tokenPart = 'e'.repeat(REFRESH_TOKEN_SIZE * 2);
    const refreshToken = `${tokenId}.${tokenPart}`;
    
    mockRefreshTokenDao.findById.mockResolvedValueOnce({
      id: tokenId,
      user_id: 1,
      hashed_token: 'e'.repeat(64),
      expired_at: new Date(Date.now() + 86400000)
    });

    await expect(authService.logout({ user_id: 1 }, refreshToken))
      .rejects.toThrow('Invalid refresh token.');
    expect(mockRefreshTokenDao.revoke).not.toHaveBeenCalled();
  });
});