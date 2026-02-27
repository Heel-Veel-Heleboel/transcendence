import { AuthService } from '../services/auth.js';
import { FastifyRequest, FastifyReply } from 'fastify';
import {
  SafeUserDto,
  LoggedInUserDto,
  RefreshedTokensDto
} from '../types/dtos/auth.js';
import * as SchemaTypes from '../schemas/auth.js';
import { getJwtConfig } from '../config/jwt.js';
import { AuthenticationError } from '../error/auth.js';
import { AUTH_PREFIX } from '../constants/auth.js';
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async register(
    request: FastifyRequest<{ Body: SchemaTypes.RegistrationSchemaType }>,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    request.log.info({ email: request.body.email }, 'Registration attempt');
    const user: SafeUserDto = await this.authService.register(request.body);
    request.log.info({ user_id: user.id }, 'User registered successfully');
    return reply.code(201).send(user);
  }

  async login(
    request: FastifyRequest<{ Body: SchemaTypes.LoginSchemaType }>,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    request.log.info({ email: request.body.email }, 'Login attempt');
    const { refresh_token, ...safeUser }: LoggedInUserDto =
      await this.authService.login(request.body);
    request.log.info({ user_id: safeUser.id }, 'User logged in successfully');

    reply.setCookie('refresh_token', refresh_token, {
      httpOnly: true,
      path: '/',
      maxAge: getJwtConfig().expirationRefreshToken,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    });

    return reply.code(200).send(safeUser);
  }

  async logout(
    request: FastifyRequest<{ Body: SchemaTypes.LogoutSchemaType }>,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    request.log.info({ user_id: request.body.user_id }, 'Logout attempt');
    const refresh_token = request.cookies['refresh_token'];
    if (!refresh_token) {
      request.log.warn(
        { user_id: request.body.user_id },
        'Refresh token cookie is missing'
      );
      throw new AuthenticationError('Refresh token cookie is missing');
    }
    await this.authService.logout(request.body, refresh_token);
    request.log.info(
      { user_id: request.body.user_id },
      'User logged out successfully'
    );

    reply.setCookie('refresh_token', '', {
      httpOnly: true,
      path: AUTH_PREFIX,
      maxAge: 0,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    });

    return reply.code(204).send();
  }

  async refresh(
    request: FastifyRequest<{ Body: SchemaTypes.RefreshSchemaType }>,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    request.log.info(
      { user_id: request.body.user_id },
      'Token refresh attempt'
    );

    const refresh_token = request.cookies['refresh_token'];
    if (!refresh_token) {
      request.log.warn(
        { user_id: request.body.user_id },
        'Refresh token cookie is missing'
      );
      throw new AuthenticationError('Refresh token cookie is missing');
    }
    const { new_refresh_token, ...access_token }: RefreshedTokensDto =
      await this.authService.refresh(
        { user_id: request.body.user_id },
        refresh_token
      );

    request.log.info(
      { user_id: request.body.user_id },
      'Tokens refreshed successfully'
    );

    reply.setCookie('refresh_token', new_refresh_token, {
      httpOnly: true,
      path: AUTH_PREFIX,
      maxAge: getJwtConfig().expirationRefreshToken,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    });

    return reply.code(200).send(access_token);
  }

  async changePassword(
    request: FastifyRequest<{ Body: SchemaTypes.ChangePasswordSchemaType }>,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    request.log.info(
      { user_id: request.body.user_id },
      'Change password attempt'
    );
    await this.authService.changePassword(request.body);
    request.log.info(
      { user_id: request.body.user_id },
      'Password changed successfully'
    );
    return reply.code(204).send();
  }
}
