import { AuthService } from '../../../src/auth/src/services/auth.js';
import { AuthenticationError } from '../../../src/auth/src/error/auth.js';
import * as passwordHasherModule from '../../../src/auth/src/utils/password-hash.js';
import * as jwtModule from '../../../src/auth/src/utils/jwt.js';
import { expect, describe, beforeEach, vi, it } from 'vitest';
import { REFRESH_TOKEN_SIZE } from '../../../src/auth/src/constants/jwt.js';


vi.mock('../../../src/auth/src/utils/password-hash.js');
vi.mock('../../../src/auth/src/utils/jwt.js');

const mockUserService = {
  findUserByEmail: vi.fn()
};
const mockCredentialDao = {
  create: vi.fn(),
  findByUserId: vi.fn()
};

const mockRefreshTokenDao = {
  create: vi.fn()
};


describe('AuthService - Login', () => {

  let authService:  AuthService;

  beforeEach(()=>{
    vi.clearAllMocks();
    authService = new AuthService(mockUserService as any, mockCredentialDao as any, mockRefreshTokenDao as any);
  });

  /**
   * TEST 1: Successful Login
   */
  it('should login successfully with valid credentials', async () => {
    const loginDto = {
      email: 'test@user.com',
      password: 'TestPassword123!'
    };

    const mockUser = {
      id: 1,
      email: 'test@user.com',
      username: 'testuser'
    };

    const mockHashedPassword = '$2b$10$hashedpassword';
    const mockAccessToken = '24raffw.wffwfwf34w.fwfwf65';
    const mockRefreshToken = 'refreshtoken';
    const mockHashedRefreshToken = 'fv233h2fv233h2b4v2vn2jnmn24m42m42b42nbteb4v2vn2jnmn24m42m42b42nb';

    mockUserService.findUserByEmail.mockResolvedValue(mockUser);
    mockCredentialDao.findByUserId.mockResolvedValue(mockHashedPassword);

    vi.spyOn(passwordHasherModule, 'comparePasswordHash').mockResolvedValue(true);
    vi.spyOn(jwtModule, 'generateAccessToken').mockReturnValue(mockAccessToken);
    vi.spyOn(jwtModule, 'generateRefreshToken').mockReturnValue(mockRefreshToken);
    vi.spyOn(jwtModule, 'hashRefreshToken').mockResolvedValue(mockHashedRefreshToken);
    mockRefreshTokenDao.create.mockResolvedValue(undefined);

    const result = await authService.login(loginDto);

  
    expect(mockUserService.findUserByEmail).toHaveBeenCalledWith(loginDto.email);
    expect(mockUserService.findUserByEmail).toBeCalledTimes(1);

    expect(mockCredentialDao.findByUserId).toHaveBeenCalledWith({ userId: mockUser.id });
    expect(mockCredentialDao.findByUserId).toBeCalledTimes(1);

    expect(passwordHasherModule.comparePasswordHash).toHaveBeenCalledWith(loginDto.password, mockHashedPassword);
    expect(passwordHasherModule.comparePasswordHash).toBeCalledTimes(1);

    expect(jwtModule.generateAccessToken).toHaveBeenCalledWith({ sub: mockUser.id, user_email: mockUser.email });
    expect(jwtModule.generateAccessToken).toBeCalledTimes(1);

    expect(jwtModule.generateRefreshToken).toHaveBeenCalledWith(REFRESH_TOKEN_SIZE);
    expect(jwtModule.generateRefreshToken).toBeCalledTimes(1);

    expect(jwtModule.hashRefreshToken).toHaveBeenCalledWith(mockRefreshToken);
    expect(jwtModule.hashRefreshToken).toBeCalledTimes(1);

    expect(mockRefreshTokenDao.create).toHaveBeenCalledWith({ userId: mockUser.id, refreshToken: mockHashedRefreshToken });
    expect(mockRefreshTokenDao.create).toBeCalledTimes(1);

    expect(result).toEqual({
      accessToken: mockAccessToken,
      refreshToken: mockRefreshToken,
      id: mockUser.id,
      name: mockUser.username,
      email: mockUser.email
    });
  });

  /**
   * TEST 2: User Not Found
   */
  it('should throw AuthenticationError when user does not exist', async () => {
    const loginDto = {
      email: 'nonexistent@user.com',
      password: 'TestPassword123!'
    };

    mockUserService.findUserByEmail.mockResolvedValue(null);

    await expect(authService.login(loginDto)).rejects.toThrow(AuthenticationError);
    await expect(authService.login(loginDto)).rejects.toThrow(
      `User with email: ${loginDto.email} does not exist.`
    );

    expect(mockCredentialDao.findByUserId).not.toHaveBeenCalled();
    expect(passwordHasherModule.comparePasswordHash).not.toHaveBeenCalled();
    expect(jwtModule.generateAccessToken).not.toHaveBeenCalled();
  });

  /**
   * TEST 3: Invalid Password
   */
  it('should throw AuthenticationError when password is invalid', async () => {
    const loginDto = {
      email: 'test@user.com',
      password: 'WrongPassword123!'
    };

    const mockUser = {
      id: 1,
      email: 'test@user.com',
      username: 'testuser'
    };

    const mockHashedPassword = '$2b$10$hashedpassword';

    mockUserService.findUserByEmail.mockResolvedValue(mockUser);
    mockCredentialDao.findByUserId.mockResolvedValue(mockHashedPassword);
    vi.spyOn(passwordHasherModule, 'comparePasswordHash').mockResolvedValue(false);

    await expect(authService.login(loginDto)).rejects.toThrow(AuthenticationError);
    await expect(authService.login(loginDto)).rejects.toThrow('Invalid credentials provided.');

    expect(passwordHasherModule.comparePasswordHash).toHaveBeenCalledWith(loginDto.password, mockHashedPassword);
    expect(jwtModule.generateAccessToken).not.toHaveBeenCalled();
    expect(jwtModule.generateRefreshToken).not.toHaveBeenCalled();
    expect(mockRefreshTokenDao.create).not.toHaveBeenCalled();
  });

  /**
   * TEST 4: No Stored Password (Edge Case)
   */
  it('should throw AuthenticationError when stored password is null', async () => {
    const loginDto = {
      email: 'test@user.com',
      password: 'TestPassword123!'
    };

    const mockUser = {
      id: 1,
      email: 'test@user.com',
      username: 'testuser'
    };

    mockUserService.findUserByEmail.mockResolvedValue(mockUser);
    mockCredentialDao.findByUserId.mockResolvedValue(null);

    await expect(authService.login(loginDto)).rejects.toThrow(AuthenticationError);
    await expect(authService.login(loginDto)).rejects.toThrow('Invalid credentials provided.');

    expect(passwordHasherModule.comparePasswordHash).not.toHaveBeenCalled();
    expect(jwtModule.generateAccessToken).not.toHaveBeenCalled();
  });

  /**
   * TEST 5: Database Error During User Lookup
   */
  it('should let database errors bubble up when finding user', async () => {
    const loginDto = {
      email: 'test@user.com',
      password: 'TestPassword123!'
    };

    const dbError = new Error('Database connection failed');
    mockUserService.findUserByEmail.mockRejectedValue(dbError);

    await expect(authService.login(loginDto)).rejects.toThrow('Database connection failed');

    expect(mockCredentialDao.findByUserId).not.toHaveBeenCalled();
  });

  /**
   * TEST 6: Database Error During Credential Lookup
   */
  it('should let database errors bubble up when finding credentials', async () => {
    const loginDto = {
      email: 'test@user.com',
      password: 'TestPassword123!'
    };

    const mockUser = {
      id: 1,
      email: 'test@user.com',
      username: 'testuser'
    };

    mockUserService.findUserByEmail.mockResolvedValue(mockUser);
    
    const dbError = new Error('Database query timeout');
    mockCredentialDao.findByUserId.mockRejectedValue(dbError);

    await expect(authService.login(loginDto)).rejects.toThrow('Database query timeout');

    expect(passwordHasherModule.comparePasswordHash).not.toHaveBeenCalled();
  });

  /**
   * TEST 7: Error During Access Token Generation
   */
  it('should let token generation errors bubble up', async () => {
    const loginDto = {
      email: 'test@user.com',
      password: 'TestPassword123!'
    };

    const mockUser = {
      id: 1,
      email: 'test@user.com',
      username: 'testuser'
    };

    const mockHashedPassword = '$2b$10$hashedpassword';

    mockUserService.findUserByEmail.mockResolvedValue(mockUser);
    mockCredentialDao.findByUserId.mockResolvedValue(mockHashedPassword);
    vi.spyOn(passwordHasherModule, 'comparePasswordHash').mockResolvedValue(true);
    
    const tokenError = new Error('Invalid signing key');
    vi.spyOn(jwtModule, 'generateAccessToken').mockImplementation(() => {
      throw tokenError;
    });

    await expect(authService.login(loginDto)).rejects.toThrow('Invalid signing key');

    expect(mockRefreshTokenDao.create).not.toHaveBeenCalled();
  });

  /**
   * TEST 8: Error During Refresh Token Generation
   */
  it('should let refresh token generation errors bubble up', async () => {
    const loginDto = {
      email: 'test@user.com',
      password: 'TestPassword123!'
    };

    const mockUser = {
      id: 1,
      email: 'test@user.com',
      username: 'testuser'
    };

    const mockHashedPassword = '$2b$10$hashedpassword';
    const mockAccessToken = '24raffw.wffwfwf34w.fwfwf65';

    mockUserService.findUserByEmail.mockResolvedValue(mockUser);
    mockCredentialDao.findByUserId.mockResolvedValue(mockHashedPassword);
    vi.spyOn(passwordHasherModule, 'comparePasswordHash').mockResolvedValue(true);
    vi.spyOn(jwtModule, 'generateAccessToken').mockReturnValue(mockAccessToken);
    
    const cryptoError = new Error('Crypto random generation failed');
    vi.spyOn(jwtModule, 'generateRefreshToken').mockImplementation(() => {
      throw cryptoError;
    });

    await expect(authService.login(loginDto)).rejects.toThrow('Crypto random generation failed');

    expect(mockRefreshTokenDao.create).not.toHaveBeenCalled();
  });

  /**
   * TEST 9: Error During Refresh Token Hashing
   */
  it('should let refresh token hashing errors bubble up', async () => {
    const loginDto = {
      email: 'test@user.com',
      password: 'TestPassword123!'
    };

    const mockUser = {
      id: 1,
      email: 'test@user.com',
      username: 'testuser'
    };

    const mockHashedPassword = '$2b$10$hashedpassword';
    const mockAccessToken = '24raffw.wffwfwf34w.fwfwf65';
    const mockRefreshToken = 'refreshtoken';

    mockUserService.findUserByEmail.mockResolvedValue(mockUser);
    mockCredentialDao.findByUserId.mockResolvedValue(mockHashedPassword);
    vi.spyOn(passwordHasherModule, 'comparePasswordHash').mockResolvedValue(true);
    vi.spyOn(jwtModule, 'generateAccessToken').mockReturnValue(mockAccessToken);
    vi.spyOn(jwtModule, 'generateRefreshToken').mockReturnValue(mockRefreshToken);
    
    const hashError = new Error('Hashing algorithm failed');
    vi.spyOn(jwtModule, 'hashRefreshToken').mockRejectedValue(hashError);

    await expect(authService.login(loginDto)).rejects.toThrow('Hashing algorithm failed');

    expect(mockRefreshTokenDao.create).not.toHaveBeenCalled();
  });

  /**
   * TEST 10: Error During Refresh Token Storage
   */
  it('should let refresh token storage errors bubble up', async () => {
    const loginDto = {
      email: 'test@user.com',
      password: 'TestPassword123!'
    };

    const mockUser = {
      id: 1,
      email: 'test@user.com',
      username: 'testuser'
    };

    const mockHashedPassword = '$2b$10$hashedpassword';
    const mockAccessToken = '24raffw.wffwfwf34w.fwfwf65';
    const mockRefreshToken = 'refreshtoken';
    const mockHashedRefreshToken = 'fv233h2fv233h2b4v2vn2jnmn24m42m42b42nb';

    mockUserService.findUserByEmail.mockResolvedValue(mockUser);
    mockCredentialDao.findByUserId.mockResolvedValue(mockHashedPassword);
    vi.spyOn(passwordHasherModule, 'comparePasswordHash').mockResolvedValue(true);
    vi.spyOn(jwtModule, 'generateAccessToken').mockReturnValue(mockAccessToken);
    vi.spyOn(jwtModule, 'generateRefreshToken').mockReturnValue(mockRefreshToken);
    vi.spyOn(jwtModule, 'hashRefreshToken').mockResolvedValue(mockHashedRefreshToken);
    
    const storageError = new Error('Database constraint violation');
    mockRefreshTokenDao.create.mockRejectedValue(storageError);

    await expect(authService.login(loginDto)).rejects.toThrow('Database constraint violation');
  });

  /**
   * TEST 11: Case Sensitivity - Email
   */
  it('should handle email case sensitivity correctly', async () => {
    const loginDto = {
      email: 'TEST@USER.COM',
      password: 'TestPassword123!'
    };

    mockUserService.findUserByEmail.mockResolvedValue(null);

    await expect(authService.login(loginDto)).rejects.toThrow(AuthenticationError);

    expect(mockUserService.findUserByEmail).toHaveBeenCalledWith('TEST@USER.COM');
  });

  /**
   * TEST 12: Multiple Users - Ensure Correct User Data
   */
  it('should return correct user data for different users', async () => {
    const loginDto = {
      email: 'user2@test.com',
      password: 'Password456!'
    };

    const mockUser = {
      id: 42,
      email: 'user2@test.com',
      username: 'seconduser'
    };

    const mockHashedPassword = '$2b$10$differenthash';
    const mockAccessToken = 'different.access.token';
    const mockRefreshToken = 'differentrefreshtoken';
    const mockHashedRefreshToken = 'differenthashedrefreshtoken';

    mockUserService.findUserByEmail.mockResolvedValue(mockUser);
    mockCredentialDao.findByUserId.mockResolvedValue(mockHashedPassword);
    vi.spyOn(passwordHasherModule, 'comparePasswordHash').mockResolvedValue(true);
    vi.spyOn(jwtModule, 'generateAccessToken').mockReturnValue(mockAccessToken);
    vi.spyOn(jwtModule, 'generateRefreshToken').mockReturnValue(mockRefreshToken);
    vi.spyOn(jwtModule, 'hashRefreshToken').mockResolvedValue(mockHashedRefreshToken);
    mockRefreshTokenDao.create.mockResolvedValue(undefined);

    const result = await authService.login(loginDto);

    expect(result).toEqual({
      accessToken: mockAccessToken,
      refreshToken: mockRefreshToken,
      id: 42,
      name: 'seconduser',
      email: 'user2@test.com'
    });
  });

  /**
   * TEST 13: Empty Password
   */
  it('should handle empty password', async () => {
    const loginDto = {
      email: 'test@user.com',
      password: ''
    };

    const mockUser = {
      id: 1,
      email: 'test@user.com',
      username: 'testuser'
    };

    const mockHashedPassword = '$2b$10$hashedpassword';

    mockUserService.findUserByEmail.mockResolvedValue(mockUser);
    mockCredentialDao.findByUserId.mockResolvedValue(mockHashedPassword);
    vi.spyOn(passwordHasherModule, 'comparePasswordHash').mockResolvedValue(false);

    await expect(authService.login(loginDto)).rejects.toThrow(AuthenticationError);
  });

  /**
   * TEST 14: Special Characters in Email
   */
  it('should handle special characters in email', async () => {
    const loginDto = {
      email: 'user+test@example.com',
      password: 'TestPassword123!'
    };

    const mockUser = {
      id: 1,
      email: 'user+test@example.com',
      username: 'testuser'
    };

    const mockHashedPassword = '$2b$10$hashedpassword';
    const mockAccessToken = 'access.token';
    const mockRefreshToken = 'refreshtoken';
    const mockHashedRefreshToken = 'hashedrefreshtoken';

    mockUserService.findUserByEmail.mockResolvedValue(mockUser);
    mockCredentialDao.findByUserId.mockResolvedValue(mockHashedPassword);
    vi.spyOn(passwordHasherModule, 'comparePasswordHash').mockResolvedValue(true);
    vi.spyOn(jwtModule, 'generateAccessToken').mockReturnValue(mockAccessToken);
    vi.spyOn(jwtModule, 'generateRefreshToken').mockReturnValue(mockRefreshToken);
    vi.spyOn(jwtModule, 'hashRefreshToken').mockResolvedValue(mockHashedRefreshToken);
    mockRefreshTokenDao.create.mockResolvedValue(undefined);

    const result = await authService.login(loginDto);

    expect(result.email).toBe('user+test@example.com');
  });

  /**
   * TEST 15: Password Comparison is Called with Correct Arguments
   */
  it('should compare password with stored hash correctly', async () => {
    const loginDto = {
      email: 'test@user.com',
      password: 'MySecurePassword!'
    };

    const mockUser = {
      id: 1,
      email: 'test@user.com',
      username: 'testuser'
    };

    const mockHashedPassword = '$2b$10$specifichash';

    mockUserService.findUserByEmail.mockResolvedValue(mockUser);
    mockCredentialDao.findByUserId.mockResolvedValue(mockHashedPassword);
    vi.spyOn(passwordHasherModule, 'comparePasswordHash').mockResolvedValue(false);

    await expect(authService.login(loginDto)).rejects.toThrow(AuthenticationError);

    expect(passwordHasherModule.comparePasswordHash).toHaveBeenCalledWith(
      'MySecurePassword!',
      '$2b$10$specifichash'
    );
  });
});