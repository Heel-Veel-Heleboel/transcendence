import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/auth.js';
import * as SchemaTypes from '../schemas/auth.js';
import { authErrorHandler } from '../error/error-handler.js';

export async function authRoutes(fastify: FastifyInstance, authController: AuthController) {

  //set error handler
  fastify.setErrorHandler(authErrorHandler);


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