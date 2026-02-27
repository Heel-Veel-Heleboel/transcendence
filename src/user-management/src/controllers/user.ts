import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '../services/user.js';
import * as SchemaTypes from '../schemas/user.services.js';
import { UserDomainErrorMessages } from '../constants/error-messages.js';

export class UserController {
  constructor(private readonly userService: UserService) {}

  async createUser(req: FastifyRequest<{ Body: SchemaTypes.CreateUserSchemaType }>, res: FastifyReply) {
    req.log.info({ email: req.body.user_email }, 'Create user attempt');
    const user = await this.userService.createUser(req.body);
    req.log.info({ user_id: user.id }, 'User created successfully');
    res.status(201).send({ user_id: user.id });
  }

  async deleteUser(req: FastifyRequest<{ Body: SchemaTypes.DeleteUserSchemaType }>, res: FastifyReply) {
    req.log.info({ user_id: req.body.user_id }, 'Delete user attempt');
    await this.userService.deleteUser(req.body);
    req.log.info({ user_id: req.body.user_id }, 'User deleted successfully');
    res.status(204).send();
  }

  async updateUserEmail(req: FastifyRequest<{ Body: SchemaTypes.UpdateUserEmailSchemaType }>, res: FastifyReply) {
    req.log.info({ user_id: req.body.user_id, email: req.body.user_email }, 'Update user email attempt');
    await this.userService.updateUserEmail(req.body);
    req.log.info({ user_id: req.body.user_id }, 'User email updated successfully');
    res.status(200).send();
  }

  async updateUserName(req: FastifyRequest<{ Body: SchemaTypes.UpdateUserNameSchemaType }>, res: FastifyReply) {
    req.log.info({ user_id: req.body.user_id, name: req.body.user_name }, 'Update user name attempt');
    await this.userService.updateUserName(req.body);
    req.log.info({ user_id: req.body.user_id }, 'User name updated successfully');
    res.status(200).send();
  }

  async updateStatus(req: FastifyRequest<{ Body: SchemaTypes.UpdateUserStatusSchemaType }>, res: FastifyReply) {
    req.log.info({ user_id: req.body.user_id, activity_status: req.body.activity_status }, 'Update user status attempt');
    await this.userService.updateStatus(req.body);
    req.log.info({ user_id: req.body.user_id }, 'User status updated successfully');
    res.status(200).send();
  }

  async findUserById(req: FastifyRequest<{ Params: SchemaTypes.FindUserByIdSchemaType }>, res: FastifyReply) {
    req.log.info({ user_id: req.params.user_id }, 'Find user by ID attempt');
    const user = await this.userService.findUserById(req.params);
    if (user) {
      res.status(200).send(user);
    } else {
      res.status(404).send({ message: UserDomainErrorMessages.USER_NOT_FOUND });
    }
  }

  async findUserByEmail(req: FastifyRequest<{ Params: SchemaTypes.FindUserByEmailSchemaType }>, res: FastifyReply) {
    req.log.info({ email: req.params.user_email }, 'Find user by email attempt');
    const user = await this.userService.findUserByEmail(req.params);
    if (user) {
      res.status(200).send(user);
    } else {
      res.status(404).send({ message: UserDomainErrorMessages.USER_NOT_FOUND });
    }
  }

  async findUserByName(req: FastifyRequest<{ Params: SchemaTypes.FindUserByNameSchemaType }>, res: FastifyReply) {
    req.log.info({ name: req.params.user_name }, 'Find user by name attempt');
    const user = await this.userService.findUserByName(req.params);
    if (user) {
      res.status(200).send(user);
    } else {
      res.status(404).send({ message: UserDomainErrorMessages.USER_NOT_FOUND });
    }
  }

  async findUsersByStatus(req: FastifyRequest<{ Params: SchemaTypes.FindUsersByStatusSchemaType }>, res: FastifyReply) {
    req.log.info({ activity_status: req.params.activity_status }, 'Find users by status attempt');
    const users = await this.userService.findUsersByStatus(req.params);
    res.status(200).send(users);
  }
}