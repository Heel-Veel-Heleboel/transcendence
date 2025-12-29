import { UserManagementService } from '../types/user-management-service.js';
import { CredentialsDaoShape } from '../types/daos/credentials.js';
import { RefreshTokenDaoShape } from '../types/daos/refresh-token.js';
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


  async register(name: string, email: string, password: string) {
    const uId = await this.userService.createUser(email, name);

    const hashedPassword = await hasher(password, SaltLimits);

    await this.credentialsDao.create({
      userId: uId,
      password: hashedPassword
    });
    return { name: name, email: email, id: uId };
  }

};
