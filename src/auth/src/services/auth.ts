import { UserManagementService } from '../types/user-management-service.js';
import { CredentialsDaoShape } from '../types/daos/credentials.js';
import { RefreshTokenDaoShape } from '../types/daos/refresh-token.js';
import { SafeUserDto, RegisterDto, LoggedInUserDto, LoginDto } from '../types/dtos/auth.js';
import { passwordHasher, comparePasswordHash } from '../utils/password-hash.js';
import { SaltLimits } from '../constants/password.js';
import { REFRESH_TOKEN_SIZE } from '../constants/jwt.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { AuthenticationError } from '../error/auth.js';

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
        console.error('Failed to cleanup user after registration error:', cleanupError);
      }
      throw error;
    }
    return { id: uId, name: registerDto.name, email: registerDto.email };
  }


  async login(loginDto: LoginDto ): Promise<LoggedInUserDto> {
    const user = await this.userService.findUserByEmail(loginDto.email);
    if (!user) {
      throw new AuthenticationError(`User with email: ${loginDto.email} does not exist.`);
    }
    const storedPassword = await this.credentialsDao.findByUserId({ userId: user.id });

    if (!storedPassword || !(await comparePasswordHash(loginDto.password, storedPassword))) {
      throw new AuthenticationError('Invalid credentials provided.');
    }
    const accessToken = generateAccessToken({ sub: user.id, user_email: user.email });
    const refreshToken = generateRefreshToken(REFRESH_TOKEN_SIZE);

    await this.refreshTokenDao.create( { id: refreshToken.id, userId: user.id, refreshToken: refreshToken.hashedRefreshToken } );
    return {
      accessToken,
      refreshToken: refreshToken.hashedRefreshToken,
      id: user.id,
      name: user.username,
      email: user.email
    };
  }
}