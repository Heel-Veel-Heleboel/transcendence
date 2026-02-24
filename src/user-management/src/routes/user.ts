import { FastifyInstance } from 'fastify';
import { UserController } from '../controllers/user.js';
import * as SchemaTypes from '../schemas/user.services.js';

export async function userRoutes(fastify: FastifyInstance, options: { userController: UserController }) {
  const { userController } = options;
  
  fastify.post<{ Body: SchemaTypes.CreateUserSchemaType }>('/create', {
    schema: {
      body: SchemaTypes.CreateUserSchema
    },
    handler: userController.createUser.bind(userController)
  });

  fastify.delete<{ Body: SchemaTypes.FindUserByIdSchemaType }>('/delete', {
    schema: {
      body: SchemaTypes.DeleteUserSchema
    },
    handler: userController.deleteUser.bind(userController)
  });

  fastify.patch<{ Body: SchemaTypes.UpdateUserEmailSchemaType }>('/update-email', {
    schema: {
      body: SchemaTypes.UpdateUserEmailSchema
    },
    handler: userController.updateUserEmail.bind(userController)
  });

  fastify.patch<{ Body: SchemaTypes.UpdateUserNameSchemaType }>('/update-name', {
    schema: {
      body: SchemaTypes.UpdateUserNameSchema
    },
    handler: userController.updateUserName.bind(userController)
  });

  fastify.patch<{ Body: SchemaTypes.UpdateUserStatusSchemaType }>('/update-status', {
    schema: {
      body: SchemaTypes.UpdateUserStatusSchema
    },
    handler: userController.updateStatus.bind(userController)
  });

  fastify.get<{ Params: SchemaTypes.FindUserByIdSchemaType }>('/find-by-id', {
    schema: {
      params: SchemaTypes.FindUserByIdSchema
    },
    handler: userController.findUserById.bind(userController)
  });

  fastify.get<{ Params: SchemaTypes.FindUserByEmailSchemaType }>('/find-by-email', {
    schema: {
      params: SchemaTypes.FindUserByEmailSchema
    },
    handler: userController.findUserByEmail.bind(userController)
  });

  fastify.get<{ Params: SchemaTypes.FindUserByNameSchemaType }>('/find-by-name', {
    schema: {
      params: SchemaTypes.FindUserByNameSchema
    },
    handler: userController.findUserByName.bind(userController)
  });

  fastify.get<{ Params: SchemaTypes.FindUsersByStatusSchemaType }>('/find-by-status', {
    schema: {
      params: SchemaTypes.FindUsersByStatusSchema
    },
    handler: userController.findUsersByStatus.bind(userController)
  });
}     