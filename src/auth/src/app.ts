import fastify from 'fastify';
import { getPrismaClient } from './db/prisma.client.js';
import { AuthService } from './services/auth.js';
import { AuthController } from './controllers/auth.js';
import { authRoutes } from './routes/auth.js';
import { CredentialsDao } from './dao/credentials.dao.js';
import { RefreshTokenDao } from './dao/refresh-token.dao.js';
import { UserManagementMock } from './mocks/user-service/user-management.js';
import { getJwtConfig } from './config/jwt.js';
import { authErrorHandler } from './middleware/error-handler.js';
import prismaDisconnectHook from './middleware/prisma-disconnect-hook.js';

  

const prisma = getPrismaClient();
const jwtConfig = getJwtConfig();
const credentialsDao = new CredentialsDao(prisma);
const refreshTokenDao = new RefreshTokenDao(prisma, jwtConfig.expirationRefreshToken);
const userManagementService = new UserManagementMock(); // Replace with actual implementation when available
const authService = new AuthService(userManagementService, credentialsDao, refreshTokenDao);
const authController = new AuthController(authService);

const app = fastify({
  logger: true
});

app.setErrorHandler(authErrorHandler);
app.addHook('onClose', prismaDisconnectHook);

app.register(authRoutes, { authController }).
  after(() => {
    console.log('Auth routes registered');
  }).
  ready((err) => {
    if (err) {
      console.error('Error during app readiness:', err);
      process.exit(1);
    }
    console.log('Auth service is ready');
  });


export default app;