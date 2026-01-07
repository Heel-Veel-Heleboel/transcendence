import { expect, it, describe, beforeEach, afterEach, vi} from 'vitest';

// Mock the crypto comparator to avoid length issues
vi.mock('../../../src/auth/src/utils/jwt.js', () => ({
  compareRefreshToken: vi.fn()
}));

import { compareRefreshToken } from '../../../src/auth/src/utils/jwt.js';
import { AuthService } from '../../../src/auth/src/services/auth';
import { AuthenticationError } from '../../../src/auth/src/error/auth.js';

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
    mockRefreshTokenDao.findById.mockResolvedValueOnce({
      id: 'test-jti',
      userId: 1,
      hashedToken: 'dummy-hash'
    });

    await expect(authService.logout({ userId: 1, refreshToken: 'test-jti.restoftoken' })).resolves.toBeUndefined();
    expect(mockRefreshTokenDao.revoke).toHaveBeenCalledWith({ id: 'test-jti' });
  });

  it('Should throw error when token jti is not found in database', async () => {
    mockRefreshTokenDao.findById.mockResolvedValueOnce(null);

    await expect(authService.logout({ userId: 1, refreshToken: 'test-jti.restoftoken' }))
      .rejects.toThrow(AuthenticationError);
    expect(compareRefreshToken).not.toHaveBeenCalled();
  });

  it('Should throw error when userId does not match token owner', async () => {
    (compareRefreshToken as unknown as vi.Mock).mockReturnValueOnce(true);
    mockRefreshTokenDao.findById.mockResolvedValueOnce({
      id: 'test-jti',
      userId: 2,
      hashedToken: 'dummy-hash'
    });

    await expect(authService.logout({ userId: 1, refreshToken: 'test-jti.restoftoken' }))
      .rejects.toThrow('User ID does not match token owner.');
    expect(mockRefreshTokenDao.revoke).not.toHaveBeenCalled();
  });

  it('Should throw error for invalid refresh token format', async () => {
    await expect(authService.logout({ userId: 1, refreshToken: 'invalidtoken' }))
      .rejects.toThrow(AuthenticationError);
    expect(mockRefreshTokenDao.findById).not.toHaveBeenCalled();
  });

  it('Should throw error when refresh token is empty', async () => {
    await expect(authService.logout({ userId: 1, refreshToken: '' }))
      .rejects.toThrow(AuthenticationError);
  });

  it('Should throw error when refresh token is malformed', async () => {
    await expect(authService.logout({ userId: 1, refreshToken: '.' }))
      .rejects.toThrow(AuthenticationError);
  });

  it('Should call revoke method after successful logout', async () => {
    (compareRefreshToken as unknown as vi.Mock).mockReturnValueOnce(true);
    mockRefreshTokenDao.findById.mockResolvedValueOnce({
      id: 'test-jti',
      userId: 1,
      hashedToken: 'dummy-hash'
    });

    await authService.logout({ userId: 1, refreshToken: 'test-jti.restoftoken' });
    expect(mockRefreshTokenDao.revoke).toHaveBeenCalledWith({ id: 'test-jti' });
  });

  it('Should throw error when refresh token does not match stored hash', async () => {
    (compareRefreshToken as unknown as Mock).mockReturnValueOnce(false);
    mockRefreshTokenDao.findById.mockResolvedValueOnce({
      id: 'test-jti',
      userId: 1,
      hashedToken: 'dummy-hash'
    });

    await expect(authService.logout({ userId: 1, refreshToken: 'test-jti.restoftoken' }))
      .rejects.toThrow('Invalid refresh token.');
    expect(mockRefreshTokenDao.revoke).not.toHaveBeenCalled();
  });
});