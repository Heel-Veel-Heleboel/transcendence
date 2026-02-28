import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/auth.js';
import * as SchemaTypes from '../schemas/auth.js';
import { validatePasswordHook } from '../middleware/validate-password-hook.js';


export async function authRoutes(fastify: FastifyInstance, options: {authController: AuthController}) {
  const { authController } = options;
  
  fastify.post<{ Body: SchemaTypes.RegistrationSchemaType }>('/register', {
    schema: SchemaTypes.RegistrationSchema,
    preValidation: validatePasswordHook,
    handler: authController.register.bind(authController)
  });

  fastify.post<{ Body: SchemaTypes.LoginSchemaType }>('/login', {
    schema: SchemaTypes.LoginSchema,
    handler: authController.login.bind(authController)
  });

  fastify.post<{ Body: SchemaTypes.LogoutSchemaType }>('/logout', {
    schema: SchemaTypes.LogoutSchema,
    handler: authController.logout.bind(authController)
  });

  fastify.post<{ Body: SchemaTypes.RefreshSchemaType }>('/refresh', {
    schema: SchemaTypes.RefreshSchema,
    handler: authController.refresh.bind(authController)
  });

  fastify.put<{ Body: SchemaTypes.ChangePasswordSchemaType }>('/change-password', {
    schema: SchemaTypes.ChangePasswordSchema,
    preValidation: validatePasswordHook,
    handler: authController.changePassword.bind(authController)
  });

  fastify.delete<{ Body: SchemaTypes.DeleteAuthDataSchemaType }>('/delete-auth-data', {
    schema: SchemaTypes.DeleteAuthDataSchema,
    handler: authController.deleteAuthDataForUser.bind(authController)
  });
}