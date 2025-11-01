import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JWTPayload } from '../entity/common';

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload | undefined;
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (config.nodeEnv !== 'production' && !authHeader) {
      request.log.debug('No Authorization header provided (non-production)');
      request.user = undefined;
      return;
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided - continue as anonymous user
      request.user = undefined;
      return;
    }

    if (authHeader.split(' ').length !== 2) {
      return reply.code(400).send({ error: 'Malformed Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
      request.user = decoded;
      request.log.info({ userId: decoded.sub }, 'Authenticated request');
    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        request.log.warn('Expired JWT token');
      } else {
        request.log.warn({ error: jwtError }, 'Invalid JWT token');
      }
      request.user = undefined;
    }
  } catch (error) {
    request.log.error({ error }, 'Auth middleware error');
    request.user = undefined;
  }
}

// Middleware factory: checks authentication and optionally roles
export function authGuard(roles?: string[]) {
  return async function middleware(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    if (roles && !roles.includes(request.user.role)) {
      return reply.code(403).send({ error: 'Forbidden' });
    }
  };
}
