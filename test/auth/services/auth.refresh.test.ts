import { expect, it, describe, beforeEach, afterEach, vi } from 'vitest';
import { REFRESH_TOKEN_SIZE } from '../../../src/auth/src/constants/jwt.js';

// Mock the crypto comparator and token generators to avoid length issues
vi.mock('../../../src/auth/src/utils/jwt.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/auth/src/utils/jwt.js')>();
  return {
    ...actual,
    compareRefreshToken: vi.fn(),
    generateAccessToken: vi.fn(),
    generateRefreshToken: vi.fn(),
    validateRefreshTokenFormat: vi.fn()
  };
});

import { compareRefreshToken, generateAccessToken, generateRefreshToken, validateRefreshTokenFormat } from '../../../src/auth/src/utils/jwt.js';
import { AuthService } from '../../../src/auth/src/services/auth';
import { AuthenticationError, AuthorizationError, ResourceNotFoundError } from '../../../src/auth/src/error/auth.js';
import { AUTH_ERROR_MESSAGES } from '../../../src/auth/src/constants/auth.js';

const mockUserService = { 
  findUserByEmail: vi.fn(),
  findByUserId: vi.fn()
};
const mockCredentialsDao = { findByUserId: vi.fn() };
const mockRefreshTokenDao = {
  store: vi.fn(),
  findByUserId: vi.fn(),
  findById: vi.fn(),
  revoke: vi.fn()
};

describe('AuthService - refresh', () => {
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

  it('Should successfully refresh tokens with valid refresh token', async () => {
    const userId = 1;
    const tokenId = '550e8400-e29b-41d4-a716-446655440000';
    const tokenPart = 'a'.repeat(REFRESH_TOKEN_SIZE * 2);
    const refreshToken = `${tokenId}.${tokenPart}`;
    const hashed_token = 'a'.repeat(64);
    
    const newTokenId = '123e4567-e89b-42d3-a456-426614174000';
    const newTokenPart = 'b'.repeat(REFRESH_TOKEN_SIZE * 2);
    const newRefreshToken = `${newTokenId}.${newTokenPart}`;
    const new_hashed_token = 'b'.repeat(64);
    const newAccessToken = 'new.access.token';

    // Return tokenId string (not boolean) when format is valid
    (validateRefreshTokenFormat as unknown as vi.Mock).mockReturnValueOnce(tokenId);
    (compareRefreshToken as unknown as vi.Mock).mockReturnValueOnce(true);
    (generateAccessToken as unknown as vi.Mock).mockReturnValueOnce(newAccessToken);
    (generateRefreshToken as unknown as vi.Mock).mockReturnValueOnce({
      id: newTokenId,
      refresh_token: newRefreshToken,
      hashed_refresh_token: new_hashed_token
    });

    mockRefreshTokenDao.findById.mockResolvedValueOnce({
      id: tokenId,
      user_id: userId,
      hashed_token: hashed_token,
      expired_at: new Date(Date.now() + 1000000)
    });

    mockUserService.findByUserId.mockResolvedValueOnce({
      id: userId,
      username: 'testuser',
      email: 'test@example.com'
    });

    mockRefreshTokenDao.store.mockResolvedValueOnce(undefined);
    mockRefreshTokenDao.revoke.mockResolvedValueOnce(undefined);

    const result = await authService.refresh({ user_id: userId, refresh_token: refreshToken });

    expect(result).toEqual({
      access_token: newAccessToken,
      refresh_token: newRefreshToken
    });
    expect(validateRefreshTokenFormat).toHaveBeenCalledWith(refreshToken);
    expect(mockRefreshTokenDao.findById).toHaveBeenCalledWith({ id: tokenId });
    expect(compareRefreshToken).toHaveBeenCalledWith(refreshToken, hashed_token);
    expect(mockUserService.findByUserId).toHaveBeenCalledWith(userId);
    expect(generateAccessToken).toHaveBeenCalledWith({
      sub: userId,
      user_email: 'test@example.com'
    });
    expect(generateRefreshToken).toHaveBeenCalledWith(REFRESH_TOKEN_SIZE);
    expect(mockRefreshTokenDao.store).toHaveBeenCalledWith({
      id: newTokenId,
      user_id: userId,
      hashed_refresh_token: new_hashed_token
    });
    expect(mockRefreshTokenDao.revoke).toHaveBeenCalledWith({ id: tokenId });
  });

  it('Should throw ResourceNotFoundError when user not found after token validation', async () => {
    const userId = 1;
    const tokenId = '9f3d5e8c-4b2a-41d7-9e3f-2a5c6d7e8f9a';
    const tokenPart = 'c'.repeat(REFRESH_TOKEN_SIZE * 2);
    const refreshToken = `${tokenId}.${tokenPart}`;
    const hashed_token = 'c'.repeat(64);

    // Return tokenId string when format is valid
    (validateRefreshTokenFormat as unknown as vi.Mock)
      .mockReturnValueOnce(tokenId)
      .mockReturnValueOnce(tokenId);
    (compareRefreshToken as unknown as vi.Mock)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true);

    mockRefreshTokenDao.findById
      .mockResolvedValueOnce({
        id: tokenId,
        user_id: userId,
        hashed_token: hashed_token,
        expired_at: new Date(Date.now() + 1000000)
      })
      .mockResolvedValueOnce({
        id: tokenId,
        user_id: userId,
        hashed_token: hashed_token,
        expired_at: new Date(Date.now() + 1000000)
      });

    mockUserService.findByUserId
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    await expect(authService.refresh({ user_id: userId, refresh_token: refreshToken }))
      .rejects.toThrow(ResourceNotFoundError);
    await expect(authService.refresh({ user_id: userId, refresh_token: refreshToken }))
      .rejects.toThrow(AUTH_ERROR_MESSAGES.USER_NOT_FOUND_BY_ID(userId));
  });

  it('Should throw AuthenticationError for invalid token format - missing dot', async () => {
    const userId = 1;
    const refreshToken = '550e8400e29b41d4a716446655440000' + 'd'.repeat(REFRESH_TOKEN_SIZE * 2);

    // Return false when format is invalid
    (validateRefreshTokenFormat as unknown as vi.Mock)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false);

    await expect(authService.refresh({ user_id: userId, refresh_token: refreshToken }))
      .rejects.toThrow(AuthenticationError);
    await expect(authService.refresh({ user_id: userId, refresh_token: refreshToken }))
      .rejects.toThrow(AUTH_ERROR_MESSAGES.INVALID_TOKEN_FORMAT);
    expect(validateRefreshTokenFormat).toHaveBeenCalledWith(refreshToken);
  });

  it('Should throw AuthenticationError for invalid token format - invalid UUID v4 (missing version)', async () => {
    const userId = 1;
    const tokenId = '550e8400-e29b-11d4-a716-446655440000'; // version 1, not 4
    const tokenPart = 'e'.repeat(REFRESH_TOKEN_SIZE * 2);
    const refreshToken = `${tokenId}.${tokenPart}`;

    // Return false when format is invalid
    (validateRefreshTokenFormat as unknown as vi.Mock)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false);

    await expect(authService.refresh({ user_id: userId, refresh_token: refreshToken }))
      .rejects.toThrow(AuthenticationError);
    await expect(authService.refresh({ user_id: userId, refresh_token: refreshToken }))
      .rejects.toThrow(AUTH_ERROR_MESSAGES.INVALID_TOKEN_FORMAT);
    expect(validateRefreshTokenFormat).toHaveBeenCalledWith(refreshToken);
  });

  it('Should throw AuthenticationError for invalid token format - token part too short', async () => {
    const userId = 1;
    const tokenId = '7a8b9c0d-1e2f-4a4b-9c6d-7e8f9a0b1c2d';
    const tokenPart = 'f'.repeat(REFRESH_TOKEN_SIZE * 2 - 1); // One character short
    const refreshToken = `${tokenId}.${tokenPart}`;

    // Return false when format is invalid
    (validateRefreshTokenFormat as unknown as vi.Mock)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false);

    await expect(authService.refresh({ user_id: userId, refresh_token: refreshToken }))
      .rejects.toThrow(AuthenticationError);
    await expect(authService.refresh({ user_id: userId, refresh_token: refreshToken }))
      .rejects.toThrow(AUTH_ERROR_MESSAGES.INVALID_TOKEN_FORMAT);
    expect(validateRefreshTokenFormat).toHaveBeenCalledWith(refreshToken);
  });

  it('Should throw AuthenticationError for invalid token format - token part too long', async () => {
    const userId = 1;
    const tokenId = '3c4d5e6f-7a8b-4c0d-9e2f-3a4b5c6d7e8f';
    const tokenPart = '0'.repeat(REFRESH_TOKEN_SIZE * 2 + 1); // One character extra
    const refreshToken = `${tokenId}.${tokenPart}`;

    // Return false when format is invalid
    (validateRefreshTokenFormat as unknown as vi.Mock)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false);

    await expect(authService.refresh({ user_id: userId, refresh_token: refreshToken }))
      .rejects.toThrow(AuthenticationError);
    await expect(authService.refresh({ user_id: userId, refresh_token: refreshToken }))
      .rejects.toThrow(AUTH_ERROR_MESSAGES.INVALID_TOKEN_FORMAT);
    expect(validateRefreshTokenFormat).toHaveBeenCalledWith(refreshToken);
  });

  it('Should throw AuthenticationError for invalid token format - non-hex characters in token part', async () => {
    const userId = 1;
    const tokenId = '6f7a8b9c-0d1e-4f3a-8b5c-6d7e8f9a0b1c';
    const tokenPart = '1'.repeat(REFRESH_TOKEN_SIZE * 2 - 1) + 'z'; // Invalid hex character 'z'
    const refreshToken = `${tokenId}.${tokenPart}`;

    // Return false when format is invalid
    (validateRefreshTokenFormat as unknown as vi.Mock)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false);

    await expect(authService.refresh({ user_id: userId, refresh_token: refreshToken }))
      .rejects.toThrow(AuthenticationError);
    await expect(authService.refresh({ user_id: userId, refresh_token: refreshToken }))
      .rejects.toThrow(AUTH_ERROR_MESSAGES.INVALID_TOKEN_FORMAT);
    expect(validateRefreshTokenFormat).toHaveBeenCalledWith(refreshToken);
  });

  it('Should throw AuthenticationError when refresh token not found in database', async () => {
    const userId = 1;
    const tokenId = '550e8400-e29b-41d4-a716-446655440001';
    const tokenPart = '2'.repeat(REFRESH_TOKEN_SIZE * 2);
    const refreshToken = `${tokenId}.${tokenPart}`;

    // Return tokenId string when format is valid
    (validateRefreshTokenFormat as unknown as vi.Mock)
      .mockReturnValueOnce(tokenId)
      .mockReturnValueOnce(tokenId);
    mockRefreshTokenDao.findById
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    await expect(authService.refresh({ user_id: userId, refresh_token: refreshToken }))
      .rejects.toThrow(AuthenticationError);
    await expect(authService.refresh({ user_id: userId, refresh_token: refreshToken }))
      .rejects.toThrow(AUTH_ERROR_MESSAGES.INVALID_TOKEN);
  });

  it('Should throw AuthenticationError when refresh token is expired', async () => {
    const userId = 1;
    const tokenId = '123e4567-e89b-42d3-a456-426614174001';
    const tokenPart = '3'.repeat(REFRESH_TOKEN_SIZE * 2);
    const refreshToken = `${tokenId}.${tokenPart}`;
    const hashedToken = '3'.repeat(64);

    // Return tokenId string when format is valid
    (validateRefreshTokenFormat as unknown as vi.Mock)
      .mockReturnValueOnce(tokenId)
      .mockReturnValueOnce(tokenId);
    mockRefreshTokenDao.findById
      .mockResolvedValueOnce({
        id: tokenId,
        user_id: userId,
        hashed_token: hashedToken,
        expired_at: new Date(Date.now() - 1000) // Expired 1 second ago
      })
      .mockResolvedValueOnce({
        id: tokenId,
        user_id: userId,
        hashed_token: hashedToken,
        expired_at: new Date(Date.now() - 1000)
      });

    await expect(authService.refresh({ user_id: userId, refresh_token: refreshToken }))
      .rejects.toThrow(AuthenticationError);
    await expect(authService.refresh({ user_id: userId, refresh_token: refreshToken }))
      .rejects.toThrow(AUTH_ERROR_MESSAGES.TOKEN_EXPIRED);
  });

  it('Should throw AuthenticationError when refresh token hash does not match', async () => {
    const userId = 1;
    const tokenId = '9f3d5e8c-4b2a-41d7-9e3f-2a5c6d7e8f9b';
    const tokenPart = '4'.repeat(REFRESH_TOKEN_SIZE * 2);
    const refreshToken = `${tokenId}.${tokenPart}`;
    const hashed_token = '4'.repeat(64);

    // Return tokenId string when format is valid
    (validateRefreshTokenFormat as unknown as vi.Mock)
      .mockReturnValueOnce(tokenId)
      .mockReturnValueOnce(tokenId);
    (compareRefreshToken as unknown as vi.Mock)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false);

    mockRefreshTokenDao.findById
      .mockResolvedValueOnce({
        id: tokenId,
        user_id: userId,
        hashed_token: hashed_token,
        expired_at: new Date(Date.now() + 1000000)
      })
      .mockResolvedValueOnce({
        id: tokenId,
        user_id: userId,
        hashed_token: hashed_token,
        expired_at: new Date(Date.now() + 1000000)
      });

    await expect(authService.refresh({ user_id: userId, refresh_token: refreshToken }))
      .rejects.toThrow(AuthenticationError);
    await expect(authService.refresh({ user_id: userId, refresh_token: refreshToken }))
      .rejects.toThrow(AUTH_ERROR_MESSAGES.INVALID_TOKEN);
  });

  it('Should throw AuthorizationError when userId does not match token owner', async () => {
    const userId = 1;
    const tokenOwnerId = 2;
    const tokenId = '7a8b9c0d-1e2f-4a4b-9c6d-7e8f9a0b1c2e';
    const tokenPart = '5'.repeat(REFRESH_TOKEN_SIZE * 2);
    const refreshToken = `${tokenId}.${tokenPart}`;
    const hashedToken = '5'.repeat(64);

    // Return tokenId string when format is valid
    (validateRefreshTokenFormat as unknown as vi.Mock)
      .mockReturnValueOnce(tokenId)
      .mockReturnValueOnce(tokenId);
    (compareRefreshToken as unknown as vi.Mock)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true);

    mockRefreshTokenDao.findById
      .mockResolvedValueOnce({
        id: tokenId,
        user_id: tokenOwnerId,
        hashed_token: hashedToken,
        expired_at: new Date(Date.now() + 1000000)
      })
      .mockResolvedValueOnce({
        id: tokenId,
        user_id: tokenOwnerId,
        hashed_token: hashedToken,
        expired_at: new Date(Date.now() + 1000000)
      });

    await expect(authService.refresh({ user_id: userId, refresh_token: refreshToken }))
      .rejects.toThrow(AuthorizationError);
    await expect(authService.refresh({ user_id: userId, refresh_token: refreshToken }))
      .rejects.toThrow(AUTH_ERROR_MESSAGES.TOKEN_OWNERSHIP_MISMATCH);
  });

  it('Should propagate database errors when findById fails', async () => {
    const userId = 1;
    const tokenId = '3c4d5e6f-7a8b-4c0d-9e2f-3a4b5c6d7e8a';
    const tokenPart = 'a'.repeat(REFRESH_TOKEN_SIZE * 2);
    const refreshToken = `${tokenId}.${tokenPart}`;

    // Return tokenId string when format is valid
    (validateRefreshTokenFormat as unknown as vi.Mock).mockReturnValueOnce(tokenId);
    
    const dbError = new Error('Database connection failed');
    mockRefreshTokenDao.findById.mockRejectedValueOnce(dbError);

    await expect(authService.refresh({ user_id: userId, refresh_token: refreshToken }))
      .rejects.toThrow('Database connection failed');
  });

  it('Should propagate database errors when store fails', async () => {
    const userId = 1;
    const tokenId = '6f7a8b9c-0d1e-4f3a-8b5c-6d7e8f9a0b1d';
    const tokenPart = 'b'.repeat(REFRESH_TOKEN_SIZE * 2);
    const refreshToken = `${tokenId}.${tokenPart}`;
    const hashedToken = 'b'.repeat(64);

    const newTokenId = '550e8400-e29b-41d4-a716-446655440002';
    const newTokenPart = 'c'.repeat(REFRESH_TOKEN_SIZE * 2);
    const newRefreshToken = `${newTokenId}.${newTokenPart}`;
    const newHashedToken = 'c'.repeat(64);
    const newAccessToken = 'new.access.token';

    // Return tokenId string when format is valid
    (validateRefreshTokenFormat as unknown as vi.Mock).mockReturnValueOnce(tokenId);
    (compareRefreshToken as unknown as vi.Mock).mockReturnValueOnce(true);
    (generateAccessToken as unknown as vi.Mock).mockReturnValueOnce(newAccessToken);
    (generateRefreshToken as unknown as vi.Mock).mockReturnValueOnce({
      id: newTokenId,
      refresh_token: newRefreshToken,
      hashed_refresh_token: newHashedToken
    });

    mockRefreshTokenDao.findById.mockResolvedValueOnce({
      id: tokenId,
      user_id: userId,
      hashed_refresh_token: hashedToken,
      expired_at: new Date(Date.now() + 1000000)
    });

    mockUserService.findByUserId.mockResolvedValueOnce({
      id: userId,
      username: 'testuser',
      email: 'test@example.com'
    });

    const dbError = new Error('Failed to store new token');
    mockRefreshTokenDao.store.mockRejectedValueOnce(dbError);

    await expect(authService.refresh({ user_id: userId, refresh_token: refreshToken }))
      .rejects.toThrow('Failed to store new token');
  });

  it('Should return correct DTO structure with accessToken and refreshToken', async () => {
    const userId = 1;
    const tokenId = '123e4567-e89b-42d3-a456-426614174002';
    const tokenPart = 'd'.repeat(REFRESH_TOKEN_SIZE * 2);
    const refreshToken = `${tokenId}.${tokenPart}`;
    const hashedToken = 'd'.repeat(64);
    
    const newTokenId = '9f3d5e8c-4b2a-41d7-9e3f-2a5c6d7e8f9c';
    const newTokenPart = 'e'.repeat(REFRESH_TOKEN_SIZE * 2);
    const newRefreshToken = `${newTokenId}.${newTokenPart}`;
    const newHashedToken = 'e'.repeat(64);
    const newAccessToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJfZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIn0.signature';

    // Return tokenId string when format is valid
    (validateRefreshTokenFormat as unknown as vi.Mock).mockReturnValueOnce(tokenId);
    (compareRefreshToken as unknown as vi.Mock).mockReturnValueOnce(true);
    (generateAccessToken as unknown as vi.Mock).mockReturnValueOnce(newAccessToken);
    (generateRefreshToken as unknown as vi.Mock).mockReturnValueOnce({
      id: newTokenId,
      refresh_token: newRefreshToken,
      hashed_refresh_token: newHashedToken
    });

    mockRefreshTokenDao.findById.mockResolvedValueOnce({
      id: tokenId,
      user_id: userId,
      hashed_refresh_token: hashedToken,
      expired_at: new Date(Date.now() + 1000000)
    });

    mockUserService.findByUserId.mockResolvedValueOnce({
      id: userId,
      username: 'testuser',
      email: 'test@example.com'
    });

    mockRefreshTokenDao.store.mockResolvedValueOnce(undefined);
    mockRefreshTokenDao.revoke.mockResolvedValueOnce(undefined);

    const result = await authService.refresh({ user_id: userId, refresh_token: refreshToken });

    expect(result).toHaveProperty('access_token');
    expect(result).toHaveProperty('refresh_token');
    expect(result).not.toHaveProperty('id');
    expect(result).not.toHaveProperty('name');
    expect(result).not.toHaveProperty('email');
    expect(typeof result.access_token).toBe('string');
    expect(typeof result.refresh_token).toBe('string');
  });

  it('Should throw AuthenticationError when refresh token is revoked', async () => {
    const userId = 1;
    const tokenId = '123e4567-e89b-42d3-a456-426614174003';
    const tokenPart = 'f'.repeat(REFRESH_TOKEN_SIZE * 2);
    const refreshToken = `${tokenId}.${tokenPart}`;
    const hashedToken = 'f'.repeat(64);

    // Return tokenId string when format is valid
    (validateRefreshTokenFormat as unknown as vi.Mock).mockReturnValue(tokenId);
    mockRefreshTokenDao.findById.mockResolvedValueOnce({
      id: tokenId,
      user_id: userId,
      hashed_refresh_token: hashedToken,
      expired_at: new Date(Date.now() + 1000000),
      revoked_at: new Date(Date.now() - 1000) // Revoked 1 second ago
    });
    await expect(authService.refresh({ user_id: userId, refresh_token: refreshToken }))
      .rejects.toThrow(AuthenticationError);
    await expect(authService.refresh({ user_id: userId, refresh_token: refreshToken }))
      .rejects.toThrow(AUTH_ERROR_MESSAGES.INVALID_TOKEN);
  });
});