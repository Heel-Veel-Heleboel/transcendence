import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../../src/services/auth.js';
import { AuthenticationError } from '../../src/error/auth.js';
import { AUTH_ERROR_MESSAGES } from '../../src/constants/auth.js';
import { totp } from 'otplib';
import QRCode from 'qrcode';

vi.mock('otplib', () => ({
  totp: {
    generateSecret: vi.fn(),
    keyuri: vi.fn(),
    verify: vi.fn()
  }
}));

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn()
  }
}));

const mockUserService = {
  findByUserId: vi.fn()
};
const mockCredentialsDao = {};
const mockRefreshTokenDao = {};
const mockTwoFactorAuthDao = {
  create: vi.fn(),
  delete: vi.fn(),
  enable: vi.fn(),
  increaseAttempts: vi.fn(),
  resetAttempts: vi.fn(),
  findByUserId: vi.fn()
};

describe('AuthService - Two Factor Auth', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService(
      mockUserService as any,
      mockCredentialsDao as any,
      mockRefreshTokenDao as any,
      mockTwoFactorAuthDao as any
    );
  });

  it('should setup 2FA and return QR code data', async () => {
    mockUserService.findByUserId.mockResolvedValue({
      id: 1,
      email: 'test@user.com'
    });
    mockTwoFactorAuthDao.findByUserId.mockResolvedValue(null);
    (totp.generateSecret as unknown as vi.Mock).mockReturnValue('secret');
    (totp.keyuri as unknown as vi.Mock).mockReturnValue('otpauth://test');
    (QRCode.toDataURL as unknown as vi.Mock).mockResolvedValue('data:image/png;base64,qr');

    const result = await authService.setUpTwoFactorAuth(1);

    expect(mockTwoFactorAuthDao.create).toHaveBeenCalledWith(1, 'secret');
    expect(result).toBe('data:image/png;base64,qr');
  });

  it('should verify and enable 2FA for valid token during setup', async () => {
    mockTwoFactorAuthDao.findByUserId.mockResolvedValue({
      user_id: 1,
      secret: 'secret',
      enabled: false,
      attempts: 0,
      expires_at: new Date(Date.now() + 60000),
      created_at: new Date(),
      updated_at: new Date()
    });
    (totp.verify as unknown as vi.Mock).mockReturnValue(true);

    const result = await authService.verifyTwoFactorAuth(1, '123456');

    expect(result).toBe(true);
    expect(mockTwoFactorAuthDao.enable).toHaveBeenCalledWith(1);
    expect(mockTwoFactorAuthDao.increaseAttempts).not.toHaveBeenCalled();
  });

  it('should reject invalid 2FA token and increase attempts', async () => {
    mockTwoFactorAuthDao.findByUserId.mockResolvedValue({
      user_id: 1,
      secret: 'secret',
      enabled: false,
      attempts: 0,
      expires_at: new Date(Date.now() + 60000),
      created_at: new Date(),
      updated_at: new Date()
    });
    (totp.verify as unknown as vi.Mock).mockReturnValue(false);

    await expect(authService.verifyTwoFactorAuth(1, '123456')).rejects.toThrow(AuthenticationError);
    await expect(authService.verifyTwoFactorAuth(1, '123456')).rejects.toThrow(
      AUTH_ERROR_MESSAGES.TWO_FACTOR_INVALID_TOKEN
    );
    expect(mockTwoFactorAuthDao.increaseAttempts).toHaveBeenCalledWith(1);
  });

  it('should reject setup verification when expired', async () => {
    mockTwoFactorAuthDao.findByUserId.mockResolvedValue({
      user_id: 1,
      secret: 'secret',
      enabled: false,
      attempts: 0,
      expires_at: new Date(Date.now() - 1000),
      created_at: new Date(),
      updated_at: new Date()
    });

    await expect(authService.verifyTwoFactorAuth(1, '123456')).rejects.toThrow(AuthenticationError);
    await expect(authService.verifyTwoFactorAuth(1, '123456')).rejects.toThrow(
      AUTH_ERROR_MESSAGES.TWO_FACTOR_AUTH_EXPIRED
    );
  });

  it('should reject verification after max attempts', async () => {
    mockTwoFactorAuthDao.findByUserId.mockResolvedValue({
      user_id: 1,
      secret: 'secret',
      enabled: false,
      attempts: 5,
      expires_at: new Date(Date.now() + 60000),
      created_at: new Date(),
      updated_at: new Date()
    });

    await expect(authService.verifyTwoFactorAuth(1, '123456')).rejects.toThrow(AuthenticationError);
    await expect(authService.verifyTwoFactorAuth(1, '123456')).rejects.toThrow(
      AUTH_ERROR_MESSAGES.TWO_FACTOR_AUTH_MAX_ATTEMPTS
    );
  });
});
