import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JWTPayload } from '../types';

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
    } catch (jwtError) {
      // Invalid token - log and continue as anonymous
      request.log.warn({ error: jwtError }, 'Invalid JWT token');
      request.user = undefined;
    }
  } catch (error) {
    request.log.error({ error }, 'Auth middleware error');
    request.user = undefined;
  }
}

export function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
  done: Function
): void {
  if (!request.user) {
    reply.code(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Authentication required'
    });
    return;
  }
  done();
}

export function requireRole(roles: string[]) {
  return (request: FastifyRequest, reply: FastifyReply, done: Function): void => {
    if (!request.user) {
      reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Authentication required'
      });
      return;
    }

    if (!roles.includes(request.user.role)) {
      reply.code(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
      return;
    }
    
    done();
  };
}


