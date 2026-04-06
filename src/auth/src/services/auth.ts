import { UserManagementClient } from '../client/user-management.js';
import { ICredentialsDao } from '../types/daos/credentials.js';
import { IRefreshTokenDao } from '../types/daos/refresh-token.js';
import { ITwoFactorAuthDao } from '../types/daos/2fa.js';
import {
  SafeUserDto,
  LoggedInUserDto,
  RefreshedTokensDto
} from '../types/dtos/auth.js';
import { passwordHasher, comparePasswordHash } from '../utils/password-hash.js';
import { SaltLimits } from '../constants/password.js';
import { REFRESH_TOKEN_SIZE } from '../constants/jwt.js';
import {
  generateAccessToken,
  generateRefreshToken,
  compareRefreshToken,
  validateRefreshTokenFormat
} from '../utils/jwt.js';
import {
  AuthenticationError,
  AuthorizationError,
  ResourceNotFoundError
} from '../error/auth.js';
import { AUTH_ERROR_MESSAGES } from '../constants/auth.js';
import * as SchemaTypes from '../schemas/auth.js';

import { generateSecret, verify, generateURI} from 'otplib';
import QRCode from 'qrcode';

/**
 * Authentication Service
 *
 * Provides methods for user registration and authentication.
 * Utilizes UserManagementClient for user operations,
 * ICredentialsDao for managing user credentials,
 * and IRefreshTokenDao for handling refresh tokens.
 */

export class AuthService {
  constructor(
    private readonly userService: UserManagementClient,
    private readonly credentialsDao: ICredentialsDao,
    private readonly refreshTokenDao: IRefreshTokenDao,
    private readonly twoFactorAuthDao: ITwoFactorAuthDao
  ) {}


  async register(registerDto: SchemaTypes.RegistrationSchemaType): Promise<SafeUserDto> {
    const user_id = await this.userService.createUser(registerDto.email, registerDto.user_name);
    try {
      const hashed_password = await passwordHasher(
        registerDto.password,
        SaltLimits
      );
      await this.credentialsDao.create({
        user_id: user_id,
        password: hashed_password
      });
    } catch (error) {
      try {
        await this.userService.deleteUser(user_id);
      } catch (cleanupError) {
        console.error(
          AUTH_ERROR_MESSAGES.REGISTRATION_CLEANUP_FAILED,
          cleanupError
        );
      }
      throw error;
    }
    return { id: user_id, name: registerDto.user_name, email: registerDto.email };
  }

  async login(login: SchemaTypes.LoginSchemaType): Promise<LoggedInUserDto> {
    const user = await this.userService.findUserByEmail(login.email);

    if (!user) {
      throw new ResourceNotFoundError(
        AUTH_ERROR_MESSAGES.USER_NOT_FOUND_BY_EMAIL(login.email)
      );
    }

    const storedPassword = await this.credentialsDao.findByUserId({
      user_id: user.id
    });

    if (
      !storedPassword ||
      !(await comparePasswordHash(
        login.password,
        storedPassword.hashed_password
      ))
    ) {
      throw new AuthenticationError(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
    }
    const twoFactorAuthData = await this.twoFactorAuthDao.findByUserId(user.id);
    if (twoFactorAuthData?.enabled) {
      if (!login.two_factor_token) {
        throw new AuthenticationError(AUTH_ERROR_MESSAGES.TWO_FACTOR_REQUIRED);
      }
      await this.verifyTwoFactorAuth(user.id, login.two_factor_token);
    }

    const access_token = generateAccessToken({
      sub: user.id,
      user_email: user.email,
      user_name: user.username
    });
    const refresh_token = generateRefreshToken(REFRESH_TOKEN_SIZE);

    await this.refreshTokenDao.store( { id: refresh_token.id, user_id: user.id, hashed_refresh_token: refresh_token.hashed_refresh_token } );
    await this.userService.updateActivityStatus(user.id, 'ONLINE');
    return {
      access_token: access_token,
      refresh_token: refresh_token.refresh_token,
      id: user.id,
      name: user.username,
      email: user.email
    };
  }

  async logout(
    logout: SchemaTypes.LogoutSchemaType,
    refresh_token: string
  ): Promise<void> {
    const tokenId = await this.validateRefreshToken({
      user_id: logout.user_id,
      refresh_token: refresh_token
    });
    await this.refreshTokenDao.revoke({ id: tokenId });
    await this.userService.updateActivityStatus(logout.user_id, 'OFFLINE');
  }

  async refresh(
    data: SchemaTypes.RefreshSchemaType,
    refresh_token: string
  ): Promise<RefreshedTokensDto> {
    const oldTokenId = await this.validateRefreshToken({
      user_id: data.user_id,
      refresh_token: refresh_token
    });
    const user = await this.userService.findByUserId(data.user_id);

    if (!user) {
      throw new ResourceNotFoundError(
        AUTH_ERROR_MESSAGES.USER_NOT_FOUND_BY_ID(data.user_id)
      );
    }

    const new_access_token = generateAccessToken({
      sub: user.id,
      user_email: user.email,
      user_name: user.username
    });
    const new_refresh_token = generateRefreshToken(REFRESH_TOKEN_SIZE);

    await this.refreshTokenDao.revoke({ id: oldTokenId });
    await this.refreshTokenDao.store({
      id: new_refresh_token.id,
      user_id: user.id,
      hashed_refresh_token: new_refresh_token.hashed_refresh_token
    });

    return {
      access_token: new_access_token,
      new_refresh_token: new_refresh_token.refresh_token
    };
  }

  async changePassword(
    data: SchemaTypes.ChangePasswordSchemaType
  ): Promise<void> {
    const user = await this.userService.findByUserId(data.user_id);

    if (!user) {
      throw new ResourceNotFoundError(
        AUTH_ERROR_MESSAGES.USER_NOT_FOUND_BY_ID(data.user_id)
      );
    }

    const oldCredentials = await this.credentialsDao.findByUserId({
      user_id: data.user_id
    });
    if (!oldCredentials) {
      throw new ResourceNotFoundError(
        AUTH_ERROR_MESSAGES.USER_CREDENTIAL_NOT_FOUND_BY_ID(data.user_id)
      );
    }

    if (
      !(await comparePasswordHash(
        data.current_password,
        oldCredentials.hashed_password
      ))
    ) {
      throw new AuthenticationError(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    if (data.current_password === data.new_password) {
      throw new AuthenticationError(AUTH_ERROR_MESSAGES.PASSWORD_SAME_AS_OLD);
    }
    const new_hashed_password = await passwordHasher(
      data.new_password,
      SaltLimits
    );
    await this.credentialsDao.updatePassword({
      user_id: data.user_id,
      new_password: new_hashed_password
    });
    await this.refreshTokenDao.revokeAllByUserId({ user_id: data.user_id });
    await this.refreshTokenDao.purgeRevokedExpired();
  }

  private async validateRefreshToken({
    user_id,
    refresh_token
  }: {
    user_id: number;
    refresh_token: string;
  }): Promise<string> {
    const tokenId = validateRefreshTokenFormat(refresh_token);

    if (!tokenId) {
      throw new AuthenticationError(AUTH_ERROR_MESSAGES.INVALID_TOKEN_FORMAT);
    }

    const storedTokenObject = await this.refreshTokenDao.findById({
      id: tokenId
    });
    if (!storedTokenObject || storedTokenObject.revoked_at) {
      throw new AuthenticationError(AUTH_ERROR_MESSAGES.INVALID_TOKEN);
    }

    if (user_id !== storedTokenObject.user_id) {
      throw new AuthorizationError(
        AUTH_ERROR_MESSAGES.TOKEN_OWNERSHIP_MISMATCH
      );
    }

    if (Date.now() >= storedTokenObject.expired_at.getTime()) {
      throw new AuthenticationError(AUTH_ERROR_MESSAGES.TOKEN_EXPIRED);
    }

    if (!compareRefreshToken(refresh_token, storedTokenObject.hashed_token)) {
      throw new AuthenticationError(AUTH_ERROR_MESSAGES.INVALID_TOKEN);
    }

    return tokenId;
  }


  async deleteAuthDataForUser(user_id: number): Promise<void> {
    await this.credentialsDao.deleteByUserId({ user_id });
    await this.refreshTokenDao.revokeAllByUserId({ user_id });
    await this.refreshTokenDao.purgeRevokedExpired();
    await this.twoFactorAuthDao.delete(user_id);
  }



  async setupTwoFactorAuth(user_id: number): Promise<string> {
    try {
      const user = await this.userService.findByUserId(user_id);
      if (!user) {
        throw new ResourceNotFoundError(
          AUTH_ERROR_MESSAGES.USER_NOT_FOUND_BY_ID(user_id)
        );
      }

      const existingTwoFactorAuth = await this.twoFactorAuthDao.findByUserId(user_id);
      if (existingTwoFactorAuth) {
        await this.twoFactorAuthDao.delete(user_id);
      }
      const secret = generateSecret();
      console.log('Generating 2FA secret for user_id:', user_id);
      await this.twoFactorAuthDao.create(user_id, secret);
      
      const uri = generateURI({
        issuer: 'Auth service',
        label: user.email,
        secret
      });

      const qrDataUrl = await QRCode.toDataURL(uri);
      return qrDataUrl;
    } catch {
      throw new Error(AUTH_ERROR_MESSAGES.TWO_FACTOR_SETUP_FAILED);
    }
  }

  

  async enableTwoFactorAuth(user_id: number): Promise<void> {
    await this.twoFactorAuthDao.enable(user_id);
  }




  async verifyTwoFactorAuth(user_id: number, token: string): Promise<boolean> {
    const twoFactorAuthData = await this.twoFactorAuthDao.findByUserId( user_id );
    if (!twoFactorAuthData) {
      throw new ResourceNotFoundError(
        AUTH_ERROR_MESSAGES.TWO_FACTOR_AUTH_NOT_FOUND_BY_USER_ID(user_id)
      );
    }

    if (twoFactorAuthData.attempts >= 5) {
      throw new AuthenticationError(AUTH_ERROR_MESSAGES.TWO_FACTOR_AUTH_MAX_ATTEMPTS);
    }
    if (!twoFactorAuthData.enabled && twoFactorAuthData.expires_at && twoFactorAuthData.expires_at <= new Date()) {
      throw new AuthenticationError(AUTH_ERROR_MESSAGES.TWO_FACTOR_AUTH_EXPIRED);
    }

    const result = await verify({
      token: token,
      secret: twoFactorAuthData.secret,
      algorithm: 'sha1',
      digits: 6,
      period: 30
    });
    if (!result.valid) {
      await this.twoFactorAuthDao.increaseAttempts(user_id);
      throw new AuthenticationError(AUTH_ERROR_MESSAGES.TWO_FACTOR_INVALID_TOKEN);
    }

    if (twoFactorAuthData.enabled) {
      await this.twoFactorAuthDao.resetAttempts(user_id, null);
      return true;
    }

    await this.enableTwoFactorAuth(user_id);
    return true;
  }
}
