import { expect, it, describe, beforeEach, afterEach, vi } from 'vitest';
import { REFRESH_TOKEN_SIZE } from '../../../src/auth/src/constants/jwt.js';

// Mock the JWT utilities
vi.mock('../../../src/auth/src/utils/jwt.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/auth/src/utils/jwt.js')>();
  return {
    ...actual,
    compareRefreshToken: vi.fn(),
    generateAccessToken: vi.fn(),
    generateRefreshToken: vi.fn()
  };
});

import { compareRefreshToken, generateAccessToken, generateRefreshToken } from '../../../src/auth/src/utils/jwt.js';
import { AuthService } from '../../../src/auth/src/services/auth';
import { AuthenticationError, ResourceNotFoundError, AuthorizationError } from '../../../src/auth/src/error/auth.js';

const mockUserService = {
  findUserByEmail: vi.fn(),
  findUserById: vi.fn()
};
const mockCredentialsDao = {
  findByUserId: vi.fn()
};
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

  /**
   * TEST 1: Successful Token Refresh
   */
  it('should successfully refresh tokens with valid refresh token', async () => {
    (compareRefreshToken as unknown as vi.Mock).mockReturnValueOnce(true);
    (generateAccessToken as unknown as vi.Mock).mockReturnValueOnce('new-access-token');
    (generateRefreshToken as unknown as vi.Mock).mockReturnValueOnce({
      id: 'new-token-id',
      refreshToken: 'new-refresh-token',
      hashedRefreshToken: 'new-hashed-token'
    });

    const tokenId = '550e8400-e29b-41d4-a716-446655440000';
    const tokenPart = 'a'.repeat(REFRESH_TOKEN_SIZE * 2);
    const refreshToken = `${tokenId}.${tokenPart}`;
    const userId = 1;

    mockRefreshTokenDao.findById.mockResolvedValueOnce({
      id: tokenId,
      userId: userId,
      hashedToken: 'a'.repeat(64),
      expiredAt: new Date(Date.now() + 86400000)
    });

    mockUserService.findUserById.mockResolvedValueOnce({
      id: userId,
      email: 'user@example.com',
      username: 'testuser'
    });

    const result = await authService.refresh({ userId, refreshToken });

    expect(result).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token'
    });

    expect(mockRefreshTokenDao.findById).toHaveBeenCalledWith({ id: tokenId });
    expect(mockUserService.findUserById).toHaveBeenCalledWith(userId);
    expect(generateAccessToken).toHaveBeenCalledWith({
      sub: userId,
      user_email: 'user@example.com'
    });
    expect(generateRefreshToken).toHaveBeenCalledWith(REFRESH_TOKEN_SIZE);
    expect(mockRefreshTokenDao.store).toHaveBeenCalledWith({
      id: 'new-token-id',
      userId: userId,
      refreshToken: 'new-hashed-token'
    });
    expect(mockRefreshTokenDao.revoke).toHaveBeenCalledWith({ id: tokenId });
  });

  /**
   * TEST 2: User Not Found After Validation
   */
  it('should throw ResourceNotFoundError when user does not exist', async () => {
    (compareRefreshToken as unknown as vi.Mock).mockReturnValueOnce(true);

    const tokenId = '123e4567-e89b-12d3-a456-426614174000';
    const tokenPart = 'b'.repeat(REFRESH_TOKEN_SIZE * 2);
    const refreshToken = `${tokenId}.${tokenPart}`;
    const userId = 999;

    mockRefreshTokenDao.findById.mockResolvedValueOnce({
      id: tokenId,
      userId: userId,
      hashedToken: 'b'.repeat(64),
      expiredAt: new Date(Date.now() + 86400000)
    });

    mockUserService.findUserById.mockResolvedValue(null);

    await expect(authService.refresh({ userId, refreshToken }))
      .rejects.toThrow(ResourceNotFoundError);
    
    // Reset mocks for second call
    (compareRefreshToken as unknown as vi.Mock).mockReturnValueOnce(true);
    mockRefreshTokenDao.findById.mockResolvedValueOnce({
      id: tokenId,
      userId: userId,
      hashedToken: 'b'.repeat(64),
      expiredAt: new Date(Date.now() + 86400000)
    });
    
    await expect(authService.refresh({ userId, refreshToken }))
      .rejects.toThrow(`User with ID: ${userId} does not exist.`);

    expect(mockRefreshTokenDao.store).not.toHaveBeenCalled();
    expect(mockRefreshTokenDao.revoke).not.toHaveBeenCalled();
  });

  /**
   * TEST 3: Invalid Token Format
   */
  it('should throw AuthenticationError for invalid token format', async () => {
    const userId = 1;
    const invalidToken = 'invalid-token-format';

    await expect(authService.refresh({ userId, refreshToken: invalidToken }))
      .rejects.toThrow(AuthenticationError);
    await expect(authService.refresh({ userId, refreshToken: invalidToken }))
      .rejects.toThrow('Invalid refresh token format.');

    expect(mockRefreshTokenDao.findById).not.toHaveBeenCalled();
    expect(mockUserService.findUserById).not.toHaveBeenCalled();
  });

  /**
   * TEST 4: Token Not Found in Database
   */
  it('should throw AuthenticationError when token is not found in database', async () => {
    const tokenId = '9f3d5e8c-4b2a-41d7-8e3f-2a5c6d7e8f9a';
    const tokenPart = 'c'.repeat(REFRESH_TOKEN_SIZE * 2);
    const refreshToken = `${tokenId}.${tokenPart}`;
    const userId = 1;

    mockRefreshTokenDao.findById.mockResolvedValueOnce(null);

    await expect(authService.refresh({ userId, refreshToken }))
      .rejects.toThrow(AuthenticationError);
    await expect(authService.refresh({ userId, refreshToken }))
      .rejects.toThrow('Invalid refresh token.');

    expect(mockUserService.findUserById).not.toHaveBeenCalled();
  });

  /**
   * TEST 5: Expired Token
   */
  it('should throw AuthenticationError when token is expired', async () => {
    const tokenId = '7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d';
    const tokenPart = 'd'.repeat(REFRESH_TOKEN_SIZE * 2);
    const refreshToken = `${tokenId}.${tokenPart}`;
    const userId = 1;

    mockRefreshTokenDao.findById.mockResolvedValue({
      id: tokenId,
      userId: userId,
      hashedToken: 'd'.repeat(64),
      expiredAt: new Date(Date.now() - 1000) // Expired 1 second ago
    });

    await expect(authService.refresh({ userId, refreshToken }))
      .rejects.toThrow(AuthenticationError);
    await expect(authService.refresh({ userId, refreshToken }))
      .rejects.toThrow('Refresh token has expired.');

    expect(mockUserService.findUserById).not.toHaveBeenCalled();
  });

  /**
   * TEST 6: Token Hash Mismatch
   */
  it('should throw AuthenticationError when token hash does not match', async () => {
    (compareRefreshToken as unknown as vi.Mock).mockReturnValueOnce(false);

    const tokenId = '3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f';
    const tokenPart = 'e'.repeat(REFRESH_TOKEN_SIZE * 2);
    const refreshToken = `${tokenId}.${tokenPart}`;
    const userId = 1;

    mockRefreshTokenDao.findById.mockResolvedValueOnce({
      id: tokenId,
      userId: userId,
      hashedToken: 'e'.repeat(64),
      expiredAt: new Date(Date.now() + 86400000)
    });

    await expect(authService.refresh({ userId, refreshToken }))
      .rejects.toThrow(AuthenticationError);
    await expect(authService.refresh({ userId, refreshToken }))
      .rejects.toThrow('Invalid refresh token.');

    expect(mockUserService.findUserById).not.toHaveBeenCalled();
  });

  /**
   * TEST 7: User ID Mismatch
   */
  it('should throw AuthorizationError when userId does not match token owner', async () => {
    (compareRefreshToken as unknown as vi.Mock).mockReturnValue(true);

    const tokenId = '6e7f8a9b-0c1d-2e3f-4a5b-6c7d8e9f0a1b';
    const tokenPart = 'f'.repeat(REFRESH_TOKEN_SIZE * 2);
    const refreshToken = `${tokenId}.${tokenPart}`;
    const userId = 1;
    const tokenOwnerId = 2;

    mockRefreshTokenDao.findById.mockResolvedValue({
      id: tokenId,
      userId: tokenOwnerId,
      hashedToken: 'f'.repeat(64),
      expiredAt: new Date(Date.now() + 86400000)
    });

    await expect(authService.refresh({ userId, refreshToken }))
      .rejects.toThrow(AuthorizationError);
    await expect(authService.refresh({ userId, refreshToken }))
      .rejects.toThrow('User ID does not match token owner.');

    expect(mockUserService.findUserById).not.toHaveBeenCalled();
  });

  /**
   * TEST 8: Access Token Generation Error
   */
  it('should propagate error when access token generation fails', async () => {
    (compareRefreshToken as unknown as vi.Mock).mockReturnValueOnce(true);
    (generateAccessToken as unknown as vi.Mock).mockImplementationOnce(() => {
      throw new Error('Access token generation failed');
    });

    const tokenId = '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d';
    const tokenPart = 'g'.repeat(REFRESH_TOKEN_SIZE * 2);
    const refreshToken = `${tokenId}.${tokenPart}`;
    const userId = 1;

    mockRefreshTokenDao.findById.mockResolvedValueOnce({
      id: tokenId,
      userId: userId,
      hashedToken: 'g'.repeat(64),
      expiredAt: new Date(Date.now() + 86400000)
    });

    mockUserService.findUserById.mockResolvedValueOnce({
      id: userId,
      email: 'user@example.com',
      username: 'testuser'
    });

    await expect(authService.refresh({ userId, refreshToken }))
      .rejects.toThrow('Access token generation failed');

    expect(mockRefreshTokenDao.store).not.toHaveBeenCalled();
    expect(mockRefreshTokenDao.revoke).not.toHaveBeenCalled();
  });

  /**
   * TEST 9: Refresh Token Generation Error
   */
  it('should propagate error when refresh token generation fails', async () => {
    (compareRefreshToken as unknown as vi.Mock).mockReturnValueOnce(true);
    (generateAccessToken as unknown as vi.Mock).mockReturnValueOnce('new-access-token');
    (generateRefreshToken as unknown as vi.Mock).mockImplementationOnce(() => {
      throw new Error('Refresh token generation failed');
    });

    const tokenId = '2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e';
    const tokenPart = 'h'.repeat(REFRESH_TOKEN_SIZE * 2);
    const refreshToken = `${tokenId}.${tokenPart}`;
    const userId = 1;

    mockRefreshTokenDao.findById.mockResolvedValueOnce({
      id: tokenId,
      userId: userId,
      hashedToken: 'h'.repeat(64),
      expiredAt: new Date(Date.now() + 86400000)
    });

    mockUserService.findUserById.mockResolvedValueOnce({
      id: userId,
      email: 'user@example.com',
      username: 'testuser'
    });

    await expect(authService.refresh({ userId, refreshToken }))
      .rejects.toThrow('Refresh token generation failed');

    expect(mockRefreshTokenDao.store).not.toHaveBeenCalled();
    expect(mockRefreshTokenDao.revoke).not.toHaveBeenCalled();
  });

  /**
   * TEST 10: Token Storage Error
   */
  it('should propagate error when storing new refresh token fails', async () => {
    (compareRefreshToken as unknown as vi.Mock).mockReturnValueOnce(true);
    (generateAccessToken as unknown as vi.Mock).mockReturnValueOnce('new-access-token');
    (generateRefreshToken as unknown as vi.Mock).mockReturnValueOnce({
      id: 'new-token-id',
      refreshToken: 'new-refresh-token',
      hashedRefreshToken: 'new-hashed-token'
    });

    const tokenId = '3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f';
    const tokenPart = 'i'.repeat(REFRESH_TOKEN_SIZE * 2);
    const refreshToken = `${tokenId}.${tokenPart}`;
    const userId = 1;

    mockRefreshTokenDao.findById.mockResolvedValueOnce({
      id: tokenId,
      userId: userId,
      hashedToken: 'i'.repeat(64),
      expiredAt: new Date(Date.now() + 86400000)
    });

    mockUserService.findUserById.mockResolvedValueOnce({
      id: userId,
      email: 'user@example.com',
      username: 'testuser'
    });

    mockRefreshTokenDao.store.mockRejectedValueOnce(new Error('Database connection failed'));

    await expect(authService.refresh({ userId, refreshToken }))
      .rejects.toThrow('Database connection failed');

    expect(mockRefreshTokenDao.revoke).not.toHaveBeenCalled();
  });

  /**
   * TEST 11: Old Token Revocation Error
   */
  it('should propagate error when revoking old refresh token fails', async () => {
    (compareRefreshToken as unknown as vi.Mock).mockReturnValueOnce(true);
    (generateAccessToken as unknown as vi.Mock).mockReturnValueOnce('new-access-token');
    (generateRefreshToken as unknown as vi.Mock).mockReturnValueOnce({
      id: 'new-token-id',
      refreshToken: 'new-refresh-token',
      hashedRefreshToken: 'new-hashed-token'
    });

    const tokenId = '4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a';
    const tokenPart = 'j'.repeat(REFRESH_TOKEN_SIZE * 2);
    const refreshToken = `${tokenId}.${tokenPart}`;
    const userId = 1;

    mockRefreshTokenDao.findById.mockResolvedValueOnce({
      id: tokenId,
      userId: userId,
      hashedToken: 'j'.repeat(64),
      expiredAt: new Date(Date.now() + 86400000)
    });

    mockUserService.findUserById.mockResolvedValueOnce({
      id: userId,
      email: 'user@example.com',
      username: 'testuser'
    });

    mockRefreshTokenDao.store.mockResolvedValueOnce(undefined);
    mockRefreshTokenDao.revoke.mockRejectedValueOnce(new Error('Revocation failed'));

    await expect(authService.refresh({ userId, refreshToken }))
      .rejects.toThrow('Revocation failed');

    expect(mockRefreshTokenDao.store).toHaveBeenCalled();
  });

  /**
   * TEST 12: Returns Correct Token Structure
   */
  it('should return only accessToken and refreshToken', async () => {
    (compareRefreshToken as unknown as vi.Mock).mockReturnValueOnce(true);
    (generateAccessToken as unknown as vi.Mock).mockReturnValueOnce('new-access-token');
    (generateRefreshToken as unknown as vi.Mock).mockReturnValueOnce({
      id: 'new-token-id',
      refreshToken: 'new-refresh-token',
      hashedRefreshToken: 'new-hashed-token'
    });

    const tokenId = '5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b';
    const tokenPart = 'k'.repeat(REFRESH_TOKEN_SIZE * 2);
    const refreshToken = `${tokenId}.${tokenPart}`;
    const userId = 1;

    mockRefreshTokenDao.findById.mockResolvedValueOnce({
      id: tokenId,
      userId: userId,
      hashedToken: 'k'.repeat(64),
      expiredAt: new Date(Date.now() + 86400000)
    });

    mockUserService.findUserById.mockResolvedValueOnce({
      id: userId,
      email: 'user@example.com',
      username: 'testuser'
    });

    const result = await authService.refresh({ userId, refreshToken });

    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result).not.toHaveProperty('id');
    expect(result).not.toHaveProperty('email');
    expect(result).not.toHaveProperty('name');
    expect(Object.keys(result)).toHaveLength(2);
  });

  /**
   * TEST 13: Empty Refresh Token
   */
  it('should throw AuthenticationError for empty refresh token', async () => {
    const userId = 1;

    await expect(authService.refresh({ userId, refreshToken: '' }))
      .rejects.toThrow(AuthenticationError);
    await expect(authService.refresh({ userId, refreshToken: '' }))
      .rejects.toThrow('Invalid refresh token format.');
  });

  /**
   * TEST 14: Malformed Refresh Token
   */
  it('should throw AuthenticationError for malformed refresh token', async () => {
    const userId = 1;

    await expect(authService.refresh({ userId, refreshToken: '.' }))
      .rejects.toThrow(AuthenticationError);
    await expect(authService.refresh({ userId, refreshToken: '.' }))
      .rejects.toThrow('Invalid refresh token format.');
  });

  /**
   * TEST 15: User Service Error
   */
  it('should propagate error when user service fails', async () => {
    (compareRefreshToken as unknown as vi.Mock).mockReturnValueOnce(true);

    const tokenId = '6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c';
    const tokenPart = 'l'.repeat(REFRESH_TOKEN_SIZE * 2);
    const refreshToken = `${tokenId}.${tokenPart}`;
    const userId = 1;

    mockRefreshTokenDao.findById.mockResolvedValueOnce({
      id: tokenId,
      userId: userId,
      hashedToken: 'l'.repeat(64),
      expiredAt: new Date(Date.now() + 86400000)
    });

    mockUserService.findUserById.mockRejectedValueOnce(new Error('User service unavailable'));

    await expect(authService.refresh({ userId, refreshToken }))
      .rejects.toThrow('User service unavailable');

    expect(mockRefreshTokenDao.store).not.toHaveBeenCalled();
    expect(mockRefreshTokenDao.revoke).not.toHaveBeenCalled();
  });
});
