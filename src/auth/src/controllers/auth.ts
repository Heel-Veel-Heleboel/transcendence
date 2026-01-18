import { AuthService } from '../services/auth.js';
import { FastifyRequest, FastifyReply } from 'fastify';
import {  SafeUserDto, LoggedInUserDto, LogoutDto, RefreshDto, RefreshedTokensDto, ChangePasswordDto } from '../types/dtos/auth.js';
import * as SchemaTypes from '../schemas/auth.js';


export class AuthController {
  constructor( 
  private readonly authService: AuthService
  ){}

  async register(request: FastifyRequest<{ Body: SchemaTypes.RegistrationType }>, reply: FastifyReply) : Promise<FastifyReply> {
    request.log.info({ body: request.body }, 'Registration attempt');
    const user: SafeUserDto = await this.authService.register(request.body);
    request.log.info({ user_id: user.id }, 'User registered successfully');
    return reply.code(201).send(user);
  }
  
  async login(request: FastifyRequest<{ Body: SchemaTypes.LoginSchemaType }>, reply: FastifyReply) : Promise<FastifyReply> {
    request.log.info({ body: request.body }, 'Login attempt');
    const loggedInUser: LoggedInUserDto = await this.authService.login(request.body);
    request.log.info({ user_id: loggedInUser.id }, 'User logged in successfully');
    return reply.code(200).send(loggedInUser);
  }

  async logout(request: FastifyRequest<{ Body: LogoutDto }>, reply: FastifyReply) : Promise<FastifyReply> {
    request.log.info({ body: request.body }, 'Logout attempt');
    await this.authService.logout(request.body);
    request.log.info({ user_id: request.body.user_id }, 'User logged out successfully');
    return reply.code(204).send();
  }

  async refresh(request: FastifyRequest<{ Body: RefreshDto }>, reply: FastifyReply): Promise<FastifyReply> {
    request.log.info({ body: request.body }, 'Token refresh attempt');
    const refreshTokens: RefreshedTokensDto = await this.authService.refresh(request.body);
    request.log.info({ user_id: request.body.user_id }, 'Tokens refreshed successfully');
    return reply.code(200).send(refreshTokens);
  }

  async changePassword(request: FastifyRequest<{ Body: ChangePasswordDto }>, reply: FastifyReply): Promise<FastifyReply> {
    request.log.info({ body: request.body }, 'Change password attempt');
    await this.authService.changePassword(request.body);
    request.log.info({ user_id: request.body.user_id }, 'Password changed successfully');
    return reply.code(204).send();
  }
}