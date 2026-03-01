import { FastifyRequest } from 'fastify';

export function getUserIdFromHeader(request: FastifyRequest): number | null {
  const raw = request.headers['x-user-id'];
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) return null;
  return parseInt(raw, 10);
}

export function getUserNameFromHeader(request: FastifyRequest): string | null {
  const raw = request.headers['x-user-name'];
  if (!raw || typeof raw !== 'string') return null;
  return raw;
}
