import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../../../src/auth/src/services/auth.js';
import * as passwordHashModule from '../../../src/auth/src/utils/password-hash.js';
import { SaltLimits } from '../../../src/auth/src/constants/password.js';

vi.mock('../../../src/auth/src/utils/password-hash.js', () => ({
  passwordHasher: vi.fn(),
  comparePasswordHash: vi.fn()
}));

const MockUserService = {
  findByUserId: vi.fn()
};

const MockCredentialsDao = {
  findByUserId: vi.fn(),
  updatePassword: vi.fn()
};

const MockRefreshTokenDao = {
  revokeAllByUserId: vi.fn(),
  purgeRevokedExpired: vi.fn()
};

describe('AuthService - changePassword', () => {
  let authService: AuthService;
  
  const MockUser = { id: 1, email: 'mockUser@gmail.com', username: 'Mock Johnson' };
  const MockCredentials = { user_id: 1, hashed_password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZGHFQW1Yy1Q9wFQZ1rQ1Q9wFQZ1rQ' };
  
  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService(
      MockUserService as any, 
      MockCredentialsDao as any,
      MockRefreshTokenDao as any
    );
  });

  it('Should change the password successfully', async () => {
    MockUserService.findByUserId.mockResolvedValue(MockUser);
    MockCredentialsDao.findByUserId.mockResolvedValue(MockCredentials);
    vi.mocked(passwordHashModule.comparePasswordHash).mockResolvedValue(true);
    vi.mocked(passwordHashModule.passwordHasher).mockResolvedValue('newhashed_password');
    MockCredentialsDao.updatePassword.mockResolvedValue(undefined);
    MockRefreshTokenDao.revokeAllByUserId.mockResolvedValue(undefined);
    MockRefreshTokenDao.purgeRevokedExpired.mockResolvedValue(undefined);

    const changePasswordDto = {
      user_id: 1,
      currentPassword: 'oldPassword',
      newPassword: 'newPassword'
    };

    await expect(authService.changePassword(changePasswordDto)).resolves.toBeUndefined();
    
    expect(MockUserService.findByUserId).toHaveBeenCalledWith(1);
    expect(MockCredentialsDao.findByUserId).toHaveBeenCalledWith({ user_id: 1 });
    expect(passwordHashModule.comparePasswordHash).toHaveBeenCalledWith('oldPassword', MockCredentials.hashed_password);
    expect(MockCredentialsDao.updatePassword).toHaveBeenCalledWith({ user_id: 1, newPassword: 'newhashed_password' });
    expect(MockRefreshTokenDao.revokeAllByUserId).toHaveBeenCalledWith({ user_id: 1 });
    expect(MockRefreshTokenDao.purgeRevokedExpired).toHaveBeenCalled();
  });


  it('Should throw error if user not found', async () => {
    MockUserService.findByUserId.mockResolvedValue(null);

    const changePasswordDto = {
      user_id: 1,
      currentPassword: 'oldPassword',
      newPassword: 'newPassword'
    };

    await expect(authService.changePassword(changePasswordDto)).rejects.toThrow('User with ID: 1 does not exist.');
    
    expect(MockUserService.findByUserId).toHaveBeenCalledWith(1);
    expect(MockCredentialsDao.findByUserId).not.toHaveBeenCalled();
    expect(passwordHashModule.comparePasswordHash).not.toHaveBeenCalled();
    expect(MockCredentialsDao.updatePassword).not.toHaveBeenCalled();
    expect(MockRefreshTokenDao.revokeAllByUserId).not.toHaveBeenCalled();
    expect(MockRefreshTokenDao.purgeRevokedExpired).not.toHaveBeenCalled();
  });

  it('Should throw error if current password is incorrect', async () => {
    MockUserService.findByUserId.mockResolvedValue(MockUser);
    MockCredentialsDao.findByUserId.mockResolvedValue(MockCredentials);
    vi.mocked(passwordHashModule.comparePasswordHash).mockResolvedValue(false);

    const changePasswordDto = {
      user_id: 1,
      currentPassword: 'wrongOldPassword',
      newPassword: 'newPassword'
    };

    await expect(authService.changePassword(changePasswordDto)).rejects.toThrow('Invalid credentials provided.');
    
    expect(MockUserService.findByUserId).toHaveBeenCalledWith(1);
    expect(MockCredentialsDao.findByUserId).toHaveBeenCalledWith({ user_id: 1 });
    expect(passwordHashModule.comparePasswordHash).toHaveBeenCalledWith('wrongOldPassword', MockCredentials.hashed_password);
    expect(MockCredentialsDao.updatePassword).not.toHaveBeenCalled();
    expect(MockRefreshTokenDao.revokeAllByUserId).not.toHaveBeenCalled();
    expect(MockRefreshTokenDao.purgeRevokedExpired).not.toHaveBeenCalled();
  });

  it('Should throw error if user credentials not found', async () => {
    MockUserService.findByUserId.mockResolvedValue(MockUser);
    MockCredentialsDao.findByUserId.mockResolvedValue(null);

    const changePasswordDto = {
      user_id: 1,
      currentPassword: 'oldPassword',
      newPassword: 'newPassword'
    };

    await expect(authService.changePassword(changePasswordDto)).rejects.toThrow('User credentials for user ID: 1 do not exist.');
    
    expect(MockUserService.findByUserId).toHaveBeenCalledWith(1);
    expect(MockCredentialsDao.findByUserId).toHaveBeenCalledWith({ user_id: 1 });
    expect(passwordHashModule.comparePasswordHash).not.toHaveBeenCalled();
    expect(MockCredentialsDao.updatePassword).not.toHaveBeenCalled();
    expect(MockRefreshTokenDao.revokeAllByUserId).not.toHaveBeenCalled();
    expect(MockRefreshTokenDao.purgeRevokedExpired).not.toHaveBeenCalled();
  }); 

  it ('Should handle DAO update password failure', async () => {
    MockUserService.findByUserId.mockResolvedValue(MockUser);
    MockCredentialsDao.findByUserId.mockResolvedValue(MockCredentials);
    vi.mocked(passwordHashModule.comparePasswordHash).mockResolvedValue(true);
    vi.mocked(passwordHashModule.passwordHasher).mockResolvedValue('newhashed_password');
    MockCredentialsDao.updatePassword.mockRejectedValue(new Error('DAO update failed'));

    const changePasswordDto = {
      user_id: 1,
      currentPassword: 'oldPassword',
      newPassword: 'newPassword'
    };

    await expect(authService.changePassword(changePasswordDto)).rejects.toThrow('DAO update failed');
    
    expect(MockUserService.findByUserId).toHaveBeenCalledWith(1);
    expect(MockCredentialsDao.findByUserId).toHaveBeenCalledWith({ user_id: 1 });
    expect(passwordHashModule.comparePasswordHash).toHaveBeenCalledWith('oldPassword', MockCredentials.hashed_password);
    expect(MockCredentialsDao.updatePassword).toHaveBeenCalledWith({ user_id: 1, newPassword: 'newhashed_password' });
    expect(MockRefreshTokenDao.revokeAllByUserId).not.toHaveBeenCalled();
    expect(MockRefreshTokenDao.purgeRevokedExpired).not.toHaveBeenCalled();
  });

  it ('Should handle password hashing failure', async () => {
    MockUserService.findByUserId.mockResolvedValue(MockUser);
    MockCredentialsDao.findByUserId.mockResolvedValue(MockCredentials);
    vi.mocked(passwordHashModule.comparePasswordHash).mockResolvedValue(true);
    vi.mocked(passwordHashModule.passwordHasher).mockRejectedValue(new Error('Hashing failed'));

    const changePasswordDto = {
      user_id: 1,
      currentPassword: 'oldPassword',
      newPassword: 'newPassword'
    };

    await expect(authService.changePassword(changePasswordDto)).rejects.toThrow('Hashing failed');
    
    expect(MockUserService.findByUserId).toHaveBeenCalledWith(1);
    expect(MockCredentialsDao.findByUserId).toHaveBeenCalledWith({ user_id: 1 });
    expect(passwordHashModule.comparePasswordHash).toHaveBeenCalledWith('oldPassword', MockCredentials.hashed_password);
    expect(passwordHashModule.passwordHasher).toHaveBeenCalledWith('newPassword', SaltLimits);
    expect(MockCredentialsDao.updatePassword).not.toHaveBeenCalled();
    expect(MockRefreshTokenDao.revokeAllByUserId).not.toHaveBeenCalled();
    expect(MockRefreshTokenDao.purgeRevokedExpired).not.toHaveBeenCalled();
  });

  it ('Should handle refresh token purge failure gracefully', async () => {
    MockUserService.findByUserId.mockResolvedValue(MockUser);
    MockCredentialsDao.findByUserId.mockResolvedValue(MockCredentials);
    vi.mocked(passwordHashModule.comparePasswordHash).mockResolvedValue(true);
    vi.mocked(passwordHashModule.passwordHasher).mockResolvedValue('newhashed_password');
    MockCredentialsDao.updatePassword.mockResolvedValue(undefined);
    MockRefreshTokenDao.revokeAllByUserId.mockResolvedValue(undefined);
    MockRefreshTokenDao.purgeRevokedExpired.mockRejectedValue(new Error('Purge failed'));

    const changePasswordDto = {
      user_id: 1,
      currentPassword: 'oldPassword',
      newPassword: 'newPassword'
    };

    await expect(authService.changePassword(changePasswordDto)).rejects.toThrow('Purge failed');
    
    expect(MockUserService.findByUserId).toHaveBeenCalledWith(1);
    expect(MockCredentialsDao.findByUserId).toHaveBeenCalledWith({ user_id: 1 });
    expect(passwordHashModule.comparePasswordHash).toHaveBeenCalledWith('oldPassword', MockCredentials.hashed_password);
    expect(MockCredentialsDao.updatePassword).toHaveBeenCalledWith({ user_id: 1, newPassword: 'newhashed_password' });
    expect(MockRefreshTokenDao.revokeAllByUserId).toHaveBeenCalledWith({ user_id: 1 });
    expect(MockRefreshTokenDao.purgeRevokedExpired).toHaveBeenCalled();
  });

  it('Should not allow changing to the same password', async () => {
    MockUserService.findByUserId.mockResolvedValue(MockUser);
    MockCredentialsDao.findByUserId.mockResolvedValue(MockCredentials);
    vi.mocked(passwordHashModule.comparePasswordHash).mockResolvedValue(true);
    vi.mocked(passwordHashModule.passwordHasher).mockResolvedValue(MockCredentials.hashed_password);
    MockCredentialsDao.updatePassword.mockResolvedValue(undefined);
    MockRefreshTokenDao.revokeAllByUserId.mockResolvedValue(undefined);
    MockRefreshTokenDao.purgeRevokedExpired.mockResolvedValue(undefined);

    const changePasswordDto = {
      user_id: 1,
      currentPassword: 'oldPassword',
      newPassword: 'oldPassword'
    };

    await expect(authService.changePassword(changePasswordDto)).rejects.toThrow('New password cannot be the same as the old password.');
    
    expect(MockUserService.findByUserId).toHaveBeenCalledWith(1);
    expect(MockCredentialsDao.findByUserId).toHaveBeenCalledWith({ user_id: 1 });
    expect(passwordHashModule.comparePasswordHash).toHaveBeenCalledWith('oldPassword', MockCredentials.hashed_password);
    expect(MockCredentialsDao.updatePassword).not.toHaveBeenCalled();
    expect(MockRefreshTokenDao.revokeAllByUserId).not.toHaveBeenCalled();
    expect(MockRefreshTokenDao.purgeRevokedExpired).not.toHaveBeenCalled();
  });

  it('Should handle revoke all tokens failure', async () => {
    MockUserService.findByUserId.mockResolvedValue(MockUser);
    MockCredentialsDao.findByUserId.mockResolvedValue(MockCredentials);
    vi.mocked(passwordHashModule.comparePasswordHash).mockResolvedValue(true);
    vi.mocked(passwordHashModule.passwordHasher).mockResolvedValue('newhashed_password');
    MockCredentialsDao.updatePassword.mockResolvedValue(undefined);
    MockRefreshTokenDao.revokeAllByUserId.mockRejectedValue(new Error('Revoke all failed'));

    const changePasswordDto = {
      user_id: 1,
      currentPassword: 'oldPassword',
      newPassword: 'newPassword'
    };

    await expect(authService.changePassword(changePasswordDto)).rejects.toThrow('Revoke all failed');
    
    expect(MockUserService.findByUserId).toHaveBeenCalledWith(1);
    expect(MockCredentialsDao.findByUserId).toHaveBeenCalledWith({ user_id: 1 });
    expect(passwordHashModule.comparePasswordHash).toHaveBeenCalledWith('oldPassword', MockCredentials.hashed_password);
    expect(MockCredentialsDao.updatePassword).toHaveBeenCalledWith({ user_id: 1, newPassword: 'newhashed_password' });
    expect(MockRefreshTokenDao.revokeAllByUserId).toHaveBeenCalledWith({ user_id: 1 });
    expect(MockRefreshTokenDao.purgeRevokedExpired).not.toHaveBeenCalled();
  });
});