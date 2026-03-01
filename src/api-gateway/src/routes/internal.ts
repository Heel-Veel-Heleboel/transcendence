import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { sendToUsers } from '../websocket/connections';

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
}
