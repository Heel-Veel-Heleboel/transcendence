import { AuthService } from '../services/auth.js';
import { FastifyRequest, FastifyReply } from 'fastify';
import { RegisterDto, SafeUserDto, LoginDto, LoggedInUserDto, LogoutDto, RefreshDto, RefreshedTokensDto, ChangePasswordDto } from '../types/dtos/auth.js';


export class AuthController {
  constructor(private readonly authService: AuthService)
  {}

  async register(request: FastifyRequest<{ Body: RegisterDto }>, reply: FastifyReply) : Promise<FastifyReply> {
    request.log.info({ email: request.body.email }, 'Registration attempt');
    const user: SafeUserDto = await this.authService.register(request.body);
    request.log.info({ userId: user.id }, 'User registered successfully');
    return reply.code(201).send(user);
  }
  
  async login(request: FastifyRequest<{ Body: LoginDto }>, reply: FastifyReply) : Promise<FastifyReply> {
    request.log.info({ email: request.body.email }, 'Login attempt');
    const loggedInUser: LoggedInUserDto = await this.authService.login(request.body);
    request.log.info({ userId: loggedInUser.id }, 'User logged in successfully');
    return reply.code(200).send(loggedInUser);
  }

  async logout(request: FastifyRequest<{ Body: LogoutDto }>, reply: FastifyReply) : Promise<FastifyReply> {
    request.log.info({ userId: request.body.userId }, 'Logout attempt');
    await this.authService.logout(request.body);
    request.log.info({ userId: request.body.userId }, 'User logged out successfully');
    return reply.code(204).send();
  }

  async refresh(request: FastifyRequest<{ Body: RefreshDto }>, reply: FastifyReply): Promise<FastifyReply> {
    request.log.info({ userId: request.body.userId }, 'Token refresh attempt');
    const refreshTokens: RefreshedTokensDto = await this.authService.refresh(request.body);
    request.log.info({ userId: request.body.userId }, 'Tokens refreshed successfully');
    return reply.code(200).send(refreshTokens);
  }

  async changePassword(request: FastifyRequest<{ Body: ChangePasswordDto }>, reply: FastifyReply): Promise<FastifyReply> {
    request.log.info({ body: request.body }, 'Change password attempt');
    await this.authService.changePassword(request.body);
    request.log.info({ userId: request.body.userId }, 'Password changed successfully');
    return reply.code(204).send();
  }
}