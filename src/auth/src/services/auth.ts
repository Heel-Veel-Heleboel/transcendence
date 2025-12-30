import { UserManagementService } from '../types/user-management-service.js';
import { CredentialsDaoShape } from '../types/daos/credentials.js';
import { RefreshTokenDaoShape } from '../types/daos/refresh-token.js';
import { SafeUserDto, RegisterDto } from '../types/dtos/auth.js';
import { hasher } from '../utils/password/hasher.js';
import { SaltLimits } from '../constants/security.js';

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
    private readonly refreshTokenDao: RefreshTokenDaoShape) {};


  async register(registerDto: RegisterDto): Promise<SafeUserDto> {
    const uId = await this.userService.createUser(registerDto.email, registerDto.name);

    try {
      const hashedPassword = await hasher(registerDto.password, SaltLimits);
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
};
