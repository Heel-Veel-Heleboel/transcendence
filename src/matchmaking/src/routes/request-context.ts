import { FastifyRequest } from 'fastify';

export function getUserIdFromHeader(request: FastifyRequest): number | null {
  const raw = request.headers['x-user-id'];
  if (!raw) return null;
  const id = parseInt(raw as string, 10);
  return isNaN(id) ? null : id;
}

export function getUserNameFromHeader(request: FastifyRequest): string | null {
  const raw = request.headers['x-user-name'];
  if (!raw || typeof raw !== 'string') return null;
  return raw;
}
