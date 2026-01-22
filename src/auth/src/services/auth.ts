import { UserManagementService } from '../types/user-management-service.js';
import { CredentialsDaoShape } from '../types/daos/credentials.js';
import { RefreshTokenDaoShape } from '../types/daos/refresh-token.js';
import { SafeUserDto, LoggedInUserDto, RefreshedTokensDto } from '../types/dtos/auth.js';
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


  async register(registerDto: SchemaTypes.RegistrationSchemaType): Promise<SafeUserDto> {
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

    const access_token = generateAccessToken({ sub: user.id, user_email: user.email });
    const refresh_token = generateRefreshToken(REFRESH_TOKEN_SIZE);

    await this.refreshTokenDao.store( { id: refresh_token.id, user_id: user.id, hashed_refresh_token: refresh_token.hashed_refresh_token } );
    return {
      access_token: access_token,
      refresh_token: refresh_token.refresh_token,
      id: user.id,
      name: user.username,
      email: user.email
    };
  }


  async logout(logout: SchemaTypes.LogoutSchemaType): Promise<void> {
    const tokenId = await this.validateRefreshToken({ user_id: logout.user_id, refresh_token: logout.refresh_token });
    await this.refreshTokenDao.revoke({ id: tokenId });
  }


  async refresh(token: SchemaTypes.RefreshSchemaType): Promise<RefreshedTokensDto> {
    const tokenId = await this.validateRefreshToken({ user_id: token.user_id, refresh_token: token.refresh_token });
    const user = await this.userService.findByUserId(token.user_id);

    if (!user) {
      throw new ResourceNotFoundError(AUTH_ERROR_MESSAGES.USER_NOT_FOUND_BY_ID(token.user_id));
    }

    const new_access_token = generateAccessToken({ sub: user.id, user_email: user.email });
    const new_refresh_token = generateRefreshToken(REFRESH_TOKEN_SIZE);

    await this.refreshTokenDao.revoke({ id: tokenId });
    await this.refreshTokenDao.store( { id: new_refresh_token.id, user_id: user.id, hashed_refresh_token: new_refresh_token.hashed_refresh_token } );

    return {
      access_token: new_access_token,
      refresh_token: new_refresh_token.refresh_token
    };
  }


  async changePassword(data: SchemaTypes.ChangePasswordSchemaType): Promise<void> {
    const user = await this.userService.findByUserId(data.user_id);

    if (!user) {
      throw new ResourceNotFoundError(AUTH_ERROR_MESSAGES.USER_NOT_FOUND_BY_ID(data.user_id));
    }

    const oldCredentials = await this.credentialsDao.findByUserId({ user_id: data.user_id });
    if (!oldCredentials) {
      throw new ResourceNotFoundError(AUTH_ERROR_MESSAGES.USER_CREDENTIAL_NOT_FOUND_BY_ID(data.user_id));
    }

    if (!(await comparePasswordHash(data.current_password, oldCredentials.hashed_password))) {
      throw new AuthenticationError(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    if (data.current_password === data.new_password) {
      throw new AuthenticationError(AUTH_ERROR_MESSAGES.PASSWORD_SAME_AS_OLD);
    }
    const new_hashed_password = await passwordHasher(data.new_password, SaltLimits);
    await this.credentialsDao.updatePassword({ user_id: data.user_id, new_password: new_hashed_password });
    await this.refreshTokenDao.revokeAllByUserId({ user_id: data.user_id });
    await this.refreshTokenDao.purgeRevokedExpired();
  }
  

  private async validateRefreshToken({ user_id, refresh_token }: { user_id: number; refresh_token: string }): Promise<string> {
    const tokenId = validateRefreshTokenFormat(refresh_token);

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
    
    if (!compareRefreshToken(refresh_token, storedTokenObject.hashed_token)) {
      throw new AuthenticationError(AUTH_ERROR_MESSAGES.INVALID_TOKEN);
    }
    
    if (user_id !== storedTokenObject.user_id) {
      throw new AuthorizationError(AUTH_ERROR_MESSAGES.TOKEN_OWNERSHIP_MISMATCH);
    }

    return tokenId;
  }
}