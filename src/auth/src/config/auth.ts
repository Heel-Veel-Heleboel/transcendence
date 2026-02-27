import { AuthService } from '../services/auth.js';
import { CredentialsDao } from '../dao/credentials.dao.js';
import { RefreshTokenDao } from '../dao/refresh-token.dao.js';
import { UserManagementClient } from '../client/user-management.js';
import { getPrismaClient } from '../db/prisma.client.js';
import { getJwtConfig } from '../config/jwt.js';
import { serverInfo } from './server-info.js';
import { AuthController } from '../controllers/auth.js';

let controllers: AuthController | null = null;

export function getAuthController(): AuthController {
  if (!controllers) {
    const jwtConfig = getJwtConfig();
    const prisma = getPrismaClient();
    const credentialsDao = new CredentialsDao(prisma);
    const userManagementService = new UserManagementClient(serverInfo.USER_MANAGEMENT_URL, 10000);
    const refreshTokenDao = new RefreshTokenDao(prisma, jwtConfig.expirationRefreshToken);
    const auth = new AuthService(userManagementService, credentialsDao, refreshTokenDao);
    controllers = new AuthController(auth);
  }
  return controllers;
}