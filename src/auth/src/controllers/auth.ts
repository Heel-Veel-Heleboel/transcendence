import { AuthService } from '../services/auth.js';
import { FastifyRequest, FastifyReply } from 'fastify';
import { RegisterDto, SafeUserDto, LoginDto, LoggedInUserDto } from '../types/dtos/auth.js';

export class AuthController {
  constructor( 
  private readonly authService: AuthService
  ){}

  async register(request: FastifyRequest<{ Body: RegisterDto }>, reply: FastifyReply) : Promise<FastifyReply> {
    const { name, email, password } = request.body;
    const user: SafeUserDto = await this.authService.register({ name, email, password });
    return reply.code(201).send(user);
  }
  
  async login(request: FastifyRequest<{ Body: LoginDto }>, reply: FastifyReply) : Promise<FastifyReply> {
    const { email, password } = request.body;
    const loggedInUser: LoggedInUserDto = await this.authService.login({ email, password });
    return reply.code(200).send(loggedInUser);
  }
}