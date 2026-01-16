import { AuthService } from '../services/auth.js';
import { FastifyRequest, FastifyReply } from 'fastify';
import { RegisterDto, SafeUserDto, LoginDto, LoggedInUserDto, LogoutDto, RefreshDto, RefreshedTokensDto } from '../types/dtos/auth.js';


export class AuthController {
  constructor( 
  private readonly authService: AuthService
  ){}

<<<<<<< HEAD
  async register(request: FastifyRequest<{ Body: RegisterDto }>, reply: FastifyReply) : Promise<FastifyReply> {
    request.log.info({ body: request.body }, 'Registration attempt');
=======
  async register(request: FastifyRequest<{ Body: RegisterDto }>, reply: FastifyReply): Promise<FastifyReply> {
>>>>>>> 55825c1 (feat: Implement refresh functionality in AuthController and add corresponding tests)
    const user: SafeUserDto = await this.authService.register(request.body);
    request.log.info({ userId: user.id }, 'User registered successfully');
    return reply.code(201).send(user);
  }
  
<<<<<<< HEAD
  async login(request: FastifyRequest<{ Body: LoginDto }>, reply: FastifyReply) : Promise<FastifyReply> {
    request.log.info({ body: request.body }, 'Login attempt');
=======
  async login(request: FastifyRequest<{ Body: LoginDto }>, reply: FastifyReply): Promise<FastifyReply> {
>>>>>>> 55825c1 (feat: Implement refresh functionality in AuthController and add corresponding tests)
    const loggedInUser: LoggedInUserDto = await this.authService.login(request.body);
    request.log.info({ userId: loggedInUser.id }, 'User logged in successfully');
    return reply.code(200).send(loggedInUser);
  }

<<<<<<< HEAD
  async logout(request: FastifyRequest<{ Body: LogoutDto }>, reply: FastifyReply) : Promise<FastifyReply> {
    request.log.info({ body: request.body }, 'Logout attempt');
=======
  async logout(request: FastifyRequest<{ Body: LogoutDto }>, reply: FastifyReply): Promise<FastifyReply> {
>>>>>>> 55825c1 (feat: Implement refresh functionality in AuthController and add corresponding tests)
    await this.authService.logout(request.body);
    request.log.info({ userId: request.body.userId }, 'User logged out successfully');
    return reply.code(204).send();
  }

  async refresh(request: FastifyRequest<{ Body: RefreshDto }>, reply: FastifyReply): Promise<FastifyReply> {
<<<<<<< HEAD
    request.log.info({ body: request.body }, 'Token refresh attempt');
    const refreshTokens: RefreshedTokensDto = await this.authService.refresh(request.body);
    request.log.info({ userId: request.body.userId }, 'Tokens refreshed successfully');
=======
    const refreshTokens: RefreshedTokensDto = await this.authService.refresh(request.body);
>>>>>>> 55825c1 (feat: Implement refresh functionality in AuthController and add corresponding tests)
    return reply.code(200).send(refreshTokens);
  }
}