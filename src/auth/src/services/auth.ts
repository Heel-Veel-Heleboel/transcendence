import { UserManagementService } from '../types/user-management-service.js';
import { CredentialsDaoShape } from '../types/daos/credentials.js';
import { RefreshTokenDaoShape } from '../types/daos/refresh-token.js';
import { SafeUserDto, LoggedInUserDto, LogoutDto, RefreshedTokensDto, RefreshDto, ChangePasswordDto } from '../types/dtos/auth.js';
import { passwordHasher, comparePasswordHash } from '../utils/password-hash.js';
import { SaltLimits } from '../constants/password.js';
import { REFRESH_TOKEN_SIZE } from '../constants/jwt.js';
import { generateAccessToken, generateRefreshToken, compareRefreshToken, validateRefreshTokenFormat } from '../utils/jwt.js';
import { AuthenticationError, AuthorizationError, ResourceNotFoundError } from '../error/auth.js';
import { AUTH_ERROR_MESSAGES } from '../constants/auth.js';

import * as SchemaTypes from '../schemas/auth.js';
/** 
 * Authentication Service
 * 
 * Provides methods for user registration and authentication.
 * Utilizes UserManagementService for user operations,
 * CredentialsDaoShape for managing user credentials,
 * and RefreshTokenDaoShape for handling refresh tokens.
 */ 

export class AuthService {
  constructor(
    private readonly userService: UserManagementService,
    private readonly credentialsDao: CredentialsDaoShape,
    private readonly refreshTokenDao: RefreshTokenDaoShape) {}


  async register(registerDto: SchemaTypes.RegistrationType): Promise<SafeUserDto> {
    const uId = await this.userService.createUser(registerDto.email, registerDto.user_name);

    try {
      const hashed_password = await passwordHasher(registerDto.password, SaltLimits);
      await this.credentialsDao.create({
        user_id: uId,
        password: hashed_password
      });
    } catch (error) {
      try {
        await this.userService.deleteUser(uId);
      } catch (cleanupError) {
        console.error(AUTH_ERROR_MESSAGES.REGISTRATION_CLEANUP_FAILED, cleanupError);
      }
      throw error;
    }
    return { id: uId, name: registerDto.user_name, email: registerDto.email };
  }


  async login(login: SchemaTypes.LoginSchemaType ): Promise<LoggedInUserDto> {
    const user = await this.userService.findUserByEmail(login.email);

    if (!user) {
      throw new ResourceNotFoundError(AUTH_ERROR_MESSAGES.USER_NOT_FOUND_BY_EMAIL(login.email));
    }

    const storedPassword = await this.credentialsDao.findByUserId({ user_id: user.id });

    if (!storedPassword || !(await comparePasswordHash(login.password, storedPassword.hashed_password))) {
      throw new AuthenticationError(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const accessToken = generateAccessToken({ sub: user.id, user_email: user.email });
    const refreshToken = generateRefreshToken(REFRESH_TOKEN_SIZE);

    await this.refreshTokenDao.store( { id: refreshToken.id, user_id: user.id, refreshToken: refreshToken.hashedRefreshToken } );
    return {
      accessToken,
      refreshToken: refreshToken.refreshToken,
      id: user.id,
      name: user.username,
      email: user.email
    };
  }


  async logout(logout: LogoutDto): Promise<void> {
    const tokenId = await this.validateRefreshToken({ user_id: logout.user_id, refreshToken: logout.refreshToken });
    await this.refreshTokenDao.revoke({ id: tokenId });
  }


  async refresh(token: RefreshDto): Promise<RefreshedTokensDto> {
    const tokenId = await this.validateRefreshToken({ user_id: token.user_id, refreshToken: token.refreshToken });
    const user = await this.userService.findByUserId(token.user_id);

    if (!user) {
      throw new ResourceNotFoundError(AUTH_ERROR_MESSAGES.USER_NOT_FOUND_BY_ID(token.user_id));
    }

    const newAccessToken = generateAccessToken({ sub: user.id, user_email: user.email });
    const newRefreshToken = generateRefreshToken(REFRESH_TOKEN_SIZE);

    await this.refreshTokenDao.revoke({ id: tokenId });
    await this.refreshTokenDao.store( { id: newRefreshToken.id, user_id: user.id, refreshToken: newRefreshToken.hashedRefreshToken } );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken.refreshToken
    };
  }


  async changePassword(data: ChangePasswordDto): Promise<void> {
    const user = await this.userService.findByUserId(data.user_id);

    if (!user) {
      throw new ResourceNotFoundError(AUTH_ERROR_MESSAGES.USER_NOT_FOUND_BY_ID(data.user_id));
    }

    const oldCredentials = await this.credentialsDao.findByUserId({ user_id: data.user_id });
    if (!oldCredentials) {
      throw new ResourceNotFoundError(AUTH_ERROR_MESSAGES.USER_CREDENTIAL_NOT_FOUND_BY_ID(data.user_id));
    }

    if (!(await comparePasswordHash(data.currentPassword, oldCredentials.hashed_password))) {
      throw new AuthenticationError(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    if (data.currentPassword === data.newPassword) {
      throw new AuthenticationError(AUTH_ERROR_MESSAGES.PASSWORD_SAME_AS_OLD);
    }
    const newhashed_password = await passwordHasher(data.newPassword, SaltLimits);
    await this.credentialsDao.updatePassword({ user_id: data.user_id, newPassword: newhashed_password });
    await this.refreshTokenDao.revokeAllByUserId({ user_id: data.user_id });
    await this.refreshTokenDao.purgeRevokedExpired();
  }
  

  private async validateRefreshToken({ user_id, refreshToken }: { user_id: number; refreshToken: string }): Promise<string> {
    const tokenId = validateRefreshTokenFormat(refreshToken);

    if (!tokenId) {
      throw new AuthenticationError(AUTH_ERROR_MESSAGES.INVALID_TOKEN_FORMAT);
    }
    
    const storedTokenObject = await this.refreshTokenDao.findById({ id: tokenId });
    if (!storedTokenObject || storedTokenObject.revoked_at) {
      throw new AuthenticationError(AUTH_ERROR_MESSAGES.INVALID_TOKEN);
    }
    
    if (Date.now() >= storedTokenObject.expired_at.getTime()) {
      throw new AuthenticationError(AUTH_ERROR_MESSAGES.TOKEN_EXPIRED);
    }
    
    if (!compareRefreshToken(refreshToken, storedTokenObject.hashed_token)) {
      throw new AuthenticationError(AUTH_ERROR_MESSAGES.INVALID_TOKEN);
    }
    
    if (user_id !== storedTokenObject.user_id) {
      throw new AuthorizationError(AUTH_ERROR_MESSAGES.TOKEN_OWNERSHIP_MISMATCH);
    }

    return tokenId;
  }
}