import { UserManagementService } from '../types/user-management-service.js';
import { CredentialsDaoShape } from '../types/daos/credentials.js';
import { RefreshTokenDaoShape } from '../types/daos/refresh-token.js';
import { SafeUserDto, RegisterDto, LoggedInUserDto, LoginDto, LogoutDto, RefreshedTokensDto, RefreshDto, ChangePasswordDto } from '../types/dtos/auth.js';
import { passwordHasher, comparePasswordHash } from '../utils/password-hash.js';
import { SaltLimits } from '../constants/password.js';
import { REFRESH_TOKEN_SIZE } from '../constants/jwt.js';
import { generateAccessToken, generateRefreshToken, compareRefreshToken, validateRefreshTokenFormat } from '../utils/jwt.js';
import { AuthenticationError, AuthorizationError, ResourceNotFoundError } from '../error/auth.js';
import { AUTH_ERROR_MESSAGES } from '../constants/auth.js';


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


  async register(registerDto: RegisterDto): Promise<SafeUserDto> {
    const uId = await this.userService.createUser(registerDto.email, registerDto.name);

    try {
      const hashedPassword = await passwordHasher(registerDto.password, SaltLimits);
      await this.credentialsDao.create({
        userId: uId,
        password: hashedPassword
      });
    } catch (error) {
      try {
        await this.userService.deleteUser(uId);
      } catch (cleanupError) {
        console.error(AUTH_ERROR_MESSAGES.REGISTRATION_CLEANUP_FAILED, cleanupError);
      }
      throw error;
    }
    return { id: uId, name: registerDto.name, email: registerDto.email };
  }


  async login(login: LoginDto ): Promise<LoggedInUserDto> {
    const user = await this.userService.findUserByEmail(login.email);
    if (!user) {
      throw new ResourceNotFoundError(AUTH_ERROR_MESSAGES.USER_NOT_FOUND_BY_EMAIL(login.email));
    }
    const storedPassword = await this.credentialsDao.findByUserId({ userId: user.id });

    if (!storedPassword || !(await comparePasswordHash(login.password, storedPassword.hashedPassword))) {
      throw new AuthenticationError(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
    }
    const accessToken = generateAccessToken({ sub: user.id, user_email: user.email });
    const refreshToken = generateRefreshToken(REFRESH_TOKEN_SIZE);

    await this.refreshTokenDao.store( { id: refreshToken.id, userId: user.id, refreshToken: refreshToken.hashedRefreshToken } );
    return {
      accessToken,
      refreshToken: refreshToken.refreshToken,
      id: user.id,
      name: user.username,
      email: user.email
    };
  }


  async logout(logout: LogoutDto): Promise<void> {
    const tokenId = await this.validateRefreshToken({ userId: logout.userId, refreshToken: logout.refreshToken });
    await this.refreshTokenDao.revoke({ id: tokenId });
  }


  async refresh(token: RefreshDto): Promise<RefreshedTokensDto> {
    const tokenId = await this.validateRefreshToken({ userId: token.userId, refreshToken: token.refreshToken });
    const user = await this.userService.findByUserId(token.userId);
    if (!user) {
      throw new ResourceNotFoundError(AUTH_ERROR_MESSAGES.USER_NOT_FOUND_BY_ID(token.userId));
    }

    const newAccessToken = generateAccessToken({ sub: user.id, user_email: user.email });
    const newRefreshToken = generateRefreshToken(REFRESH_TOKEN_SIZE);

    await this.refreshTokenDao.revoke({ id: tokenId });
    await this.refreshTokenDao.store( { id: newRefreshToken.id, userId: user.id, refreshToken: newRefreshToken.hashedRefreshToken } );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken.refreshToken
    };
  }


  async changePassword(data: ChangePasswordDto): Promise<void> {
    const user = await this.userService.findByUserId(data.userId);
    if (!user) {
      throw new ResourceNotFoundError(AUTH_ERROR_MESSAGES.USER_NOT_FOUND_BY_ID(data.userId));
    }
    const oldCredentials = await this.credentialsDao.findByUserId({ userId: data.userId });
    if (!oldCredentials) {
      throw new ResourceNotFoundError(AUTH_ERROR_MESSAGES.USER_CREDENTIAL_NOT_FOUND_BY_ID(data.userId));
    }
    if (!(await comparePasswordHash(data.currentPassword, oldCredentials.hashedPassword))) {
      throw new AuthenticationError(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
    }
    const newHashedPassword = await passwordHasher(data.newPassword, SaltLimits);
    await this.credentialsDao.updatePassword({ userId: data.userId, newPassword: newHashedPassword });
    await this.refreshTokenDao.revokeAllByUserId({ userId: data.userId });
    await this.refreshTokenDao.purgeRevokedExpired();
  }
  

  private async validateRefreshToken({ userId, refreshToken }: { userId: number; refreshToken: string }): Promise<string> {
    const tokenId = validateRefreshTokenFormat(refreshToken);
    if (!tokenId) {
      console.log(tokenId);
      throw new AuthenticationError(AUTH_ERROR_MESSAGES.INVALID_TOKEN_FORMAT);
    }
    
    const storedTokenObject = await this.refreshTokenDao.findById({ id: tokenId });
    if (!storedTokenObject || storedTokenObject.revokedAt) {
      throw new AuthenticationError(AUTH_ERROR_MESSAGES.INVALID_TOKEN);
    }
    
    if (Date.now() >= storedTokenObject.expiredAt.getTime()) {
      throw new AuthenticationError(AUTH_ERROR_MESSAGES.TOKEN_EXPIRED);
    }
    
    if (!compareRefreshToken(refreshToken, storedTokenObject.hashedToken)) {
      throw new AuthenticationError(AUTH_ERROR_MESSAGES.INVALID_TOKEN);
    }
    
    if (userId !== storedTokenObject.userId) {
      throw new AuthorizationError(AUTH_ERROR_MESSAGES.TOKEN_OWNERSHIP_MISMATCH);
    }

    return tokenId;
  }


  
}