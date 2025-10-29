import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JWTPayload } from '../entities';

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

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
      request.user = decoded;

      // Add user context to logs
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

export const requireAuth = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  if (!request.user) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
};

export const requireRole = (roles: string[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    if (!roles.includes(request.user.role)) {
      return reply.code(403).send({ error: 'Forbidden' });
    }
  };
};
