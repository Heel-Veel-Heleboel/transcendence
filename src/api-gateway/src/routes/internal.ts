import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { sendToUsers, isOnline } from '../websocket/connections';

interface NotifyBody {
  userIds: string[];
  event: {
    type: string;
    [key: string]: unknown;
  };
}

export async function internalRoutes(server: FastifyInstance): Promise<void> {
  server.post('/internal/ws/notify', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userIds, event } = request.body as NotifyBody;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return reply.code(400).send({ error: 'userIds must be a non-empty array' });
    }

    if (!event || typeof event.type !== 'string') {
      return reply.code(400).send({ error: 'event must have a type field' });
    }

    const results = sendToUsers(userIds, event);
    request.log.info({ eventType: event.type, results }, 'WebSocket notify');

    return reply.send({ results });
  });

  server.post('/internal/ws/online', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userIds } = request.body as { userIds: string[] };

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return reply.code(400).send({ error: 'userIds must be a non-empty array' });
    }

    const results = userIds.map(userId => ({ userId, online: isOnline(userId) }));
    return reply.send({ results });
  });
}
