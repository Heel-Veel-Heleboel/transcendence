import { FastifyRequest } from 'fastify';
import { AuthenticationError } from '../error/auth.js';
import { AUTH_ERROR_MESSAGES } from '../constants/auth.js';

export function getAuthenticatedUserId(request: FastifyRequest): number {
  const raw = request.headers['x-user-id'];
  if (!raw) {
    throw new AuthenticationError(AUTH_ERROR_MESSAGES.UNAUTHORIZED);
  }

  const value = Array.isArray(raw) ? raw[0] : raw;
  const userId = Number(value);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new AuthenticationError(AUTH_ERROR_MESSAGES.UNAUTHORIZED);
  }

  return userId;
}

export function requireUserIdHeader(request: FastifyRequest): void {
  getAuthenticatedUserId(request);
}
