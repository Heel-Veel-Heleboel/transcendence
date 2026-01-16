import { AuthService } from '../services/auth.js';
import { FastifyRequest, FastifyReply } from 'fastify';
<<<<<<< HEAD
import { RegisterDto, SafeUserDto, LoginDto, LoggedInUserDto } from '../types/dtos/auth.js';
=======
import { RegisterDto, SafeUserDto, LoginDto } from '../types/dtos/auth.js';
>>>>>>> 609ebfd (feat: Implement login functionality in AuthController)

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
  
  async login(request: FastifyRequest<{ Body: LoginDto }>, reply: FastifyReply) : Promise<FastifyReply> {
<<<<<<< HEAD
    const { email, password } = request.body;
<<<<<<< HEAD
    const loggedInUser: LoggedInUserDto = await this.authService.login({ email, password });
=======
    const loggedInUser = await this.authService.login({ email: email, password: password });
>>>>>>> 609ebfd (feat: Implement login functionality in AuthController)
=======
    request.log.info({ body: request.body }, 'Login attempt');
    const loggedInUser: LoggedInUserDto = await this.authService.login(request.body);
    request.log.info({ userId: loggedInUser.id }, 'User logged in successfully');
>>>>>>> bc98a1e (fix: Refactor login method and update test descriptions for consistency)
    return reply.code(200).send(loggedInUser);
  }
}