import { AuthService } from '../services/auth.js';
import { CredentialsDao } from '../dao/credentials.dao.js';
import { RefreshTokenDao } from '../dao/refresh-token.dao.js';
import { UserManagementMock } from '../mocks/user-service/user-management.js';
import { getPrismaClient } from '../db/prisma.client.js';
import { getJwtConfig } from '../config/jwt.js';

let auth: AuthService | null = null;

export function getAuthService(): AuthService {
  if (!auth) {
    const jwtConfig = getJwtConfig();
    const prisma = getPrismaClient();
    const credentialsDao = new CredentialsDao(prisma);
    const userManagementService = new UserManagementMock();
    const refreshTokenDao = new RefreshTokenDao(prisma, jwtConfig.expirationRefreshToken);
    auth = new AuthService(userManagementService, credentialsDao, refreshTokenDao);
  }
  return auth;
}