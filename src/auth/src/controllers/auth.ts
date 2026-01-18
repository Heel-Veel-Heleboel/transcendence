import { AuthService } from '../services/auth.js';
import { FastifyRequest, FastifyReply } from 'fastify';
import { RegisterDto, SafeUserDto } from '../types/dtos/auth.js';

export class AuthController {
  constructor( 
  private readonly authService: AuthService
  ){}

  async register(request: FastifyRequest<{ Body: RegisterDto }>, reply: FastifyReply) : Promise<FastifyReply> {
    request.log.info({ body: request.body }, 'Registration attempt');
    const user: SafeUserDto = await this.authService.register(request.body);
    request.log.info({ userId: user.id }, 'User registered successfully');
    return reply.code(201).send(user);
  }
}