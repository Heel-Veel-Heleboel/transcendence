import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JWTPayload } from '../entity/common';

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;
  if (config.nodeEnv !== 'production' && !authHeader) {
    request.user = undefined;
    return;
  }
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    request.user = undefined;
    return;
  }
  const bearerInfo = authHeader.split(' ');
  if (bearerInfo.length !== 2) {
    reply.code(400).send({ error: 'Malformed Authorization header' });
    return;
  }
  const token = bearerInfo[1];
  const decoded = verifyToken(token, request);
  if (!decoded) {
    request.user = undefined;
    return;
  }
  request.user = decoded;
  request.log.info({ user_id: decoded.sub }, 'Authenticated request');
}

// Verify JWT token and return payload or null
export function verifyToken(
  token: string,
  request: FastifyRequest
): JWTPayload | null {
  try {
    return jwt.verify(token, config.jwtPublicKey, { algorithms: ['RS256'] }) as unknown as JWTPayload;
  } catch (error: unknown) {
    // Type guard for error with name property (JWT library errors)
    const jwtError = error as { name?: string };
    if (jwtError.name === 'TokenExpiredError') {
      request.log.warn('Expired JWT token');
    } else if (jwtError.name === 'JsonWebTokenError') {
      request.log.warn({ error }, 'Invalid JWT token');
    } else {
      request.log.error({ error }, 'Unexpected JWT verification error');
    }
    return null;
  }
}

// Middleware factory: checks authentication
export function authGuard() {
  return async function middleware(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    if (!request.user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  };
}
