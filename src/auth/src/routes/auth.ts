import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/auth.js';
import { AuthService } from '../services/auth.js';
import * as SchemaTypes from '../schemas/auth.js';
import { UserManagementMock } from '../mocks/user-service/user-management.js';
import { CredentialsDao } from '../dao/credentials.dao.js';
import { RefreshTokenDao } from '../dao/refresh-token.dao.js';
import { getPrismaClient } from '../db/prisma.client.js';
import { getJwtConfig } from '../config/jwt.js';
import { authErrorHandler } from '../error/error-handler.js';

export async function authRoutes(fastify: FastifyInstance) {

  //set error handler
  fastify.setErrorHandler(authErrorHandler);
  
  //generated prisma client
  const prisma = getPrismaClient();

  //credentials data access object
  const credentialsDao = new CredentialsDao(prisma);
  
  //refresh token access object
  const refreshTokenDao = new RefreshTokenDao(prisma, getJwtConfig().expirationRefreshToken);

  //Mock UserManagamentService API
  const userManagementService = new UserManagementMock();

  //Auth Services
  const authService = new AuthService(userManagementService, credentialsDao, refreshTokenDao);

  // Controllers - using auth services
  const authController = new AuthController(authService);



  //routes

  fastify.post('/register',{
    schema: SchemaTypes.RegistrationSchema,
    handler: authController.register.bind(authController)
  });

  fastify.post('/login',{
    schema: SchemaTypes.LoginSchema,
    handler: authController.login.bind(authController)
  });

  fastify.post('/logout',{
    schema: SchemaTypes.LogoutSchema,
    handler: authController.logout.bind(authController)
  });

  fastify.post('/refresh',{
    schema: SchemaTypes.RefreshSchema,
    handler: authController.refresh.bind(authController)
  });

  fastify.post('/change-password',{
    schema: SchemaTypes.ChangePasswordSchema,
    handler: authController.changePassword.bind(authController)
  });

}