import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { sendToUsers, broadcastToAll } from '../websocket/connections.js';

interface NotifyBody {
  userIds: string[];
  event: {
    type: string;
    [key: string]: unknown;
  };
}

export async function internalRoutes(server: FastifyInstance): Promise<void> {
  server.post('/internal/ws/notify', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body;
    if (!body || typeof body !== 'object') {
      return reply.code(400).send({ error: 'Request body must be a JSON object' });
    }

    const { userIds, event } = body as NotifyBody;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return reply.code(400).send({ error: 'userIds must be a non-empty array' });
    }

    if (!event || typeof event.type !== 'string') {
      return reply.code(400).send({ error: 'event must have a type field' });
    }

    const results = sendToUsers(userIds, event);
    const delivered = results.filter(r => r.delivered).length;
    request.log.info({ eventType: event.type, requested: userIds.length, delivered }, 'WebSocket notify');

    return reply.send({ results });
  });

  server.post('/internal/ws/broadcast', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body;
    if (!body || typeof body !== 'object') {
      return reply.code(400).send({ error: 'Request body must be a JSON object' });
    }

    const { event } = body as { event: { type: string; [key: string]: unknown } };

    if (!event || typeof event.type !== 'string') {
      return reply.code(400).send({ error: 'event must have a type field' });
    }

    const delivered = broadcastToAll(event);
    request.log.info({ eventType: event.type, delivered }, 'WebSocket broadcast');

    return reply.send({ delivered });
  });
}
