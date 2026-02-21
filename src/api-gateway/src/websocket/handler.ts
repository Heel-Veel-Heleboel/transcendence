import { FastifyInstance } from 'fastify';
import { verifyToken } from '../middleware/auth';
import { addConnection, removeConnection } from './connections';

const AUTH_TIMEOUT_MS = 5000;

export async function websocketRoutes(server: FastifyInstance): Promise<void> {
  server.get('/ws', { websocket: true }, (connection, request) => {
    let authenticated = false;
    let userId: string;

    const timeout = setTimeout(() => {
      if (!authenticated) {
        request.log.warn('WebSocket auth timeout');
        connection.socket.close(4001, 'Authentication timeout');
      }
    }, AUTH_TIMEOUT_MS);

    connection.socket.on('message', (raw: Buffer) => {
      if (!authenticated) {
        try {
          const message = JSON.parse(raw.toString());
          if (message.type !== 'AUTH' || !message.token) {
            connection.socket.close(4002, 'Expected AUTH message with token');
            clearTimeout(timeout);
            return;
          }

          const payload = verifyToken(message.token, request);
          if (!payload) {
            connection.socket.close(4003, 'Invalid token');
            clearTimeout(timeout);
            return;
          }

          authenticated = true;
          userId = payload.sub;
          clearTimeout(timeout);
          addConnection(userId, connection);
          request.log.info({ userId }, 'WebSocket authenticated');
          connection.socket.send(JSON.stringify({ type: 'AUTH_OK' }));
        } catch {
          connection.socket.close(4002, 'Invalid message format');
          clearTimeout(timeout);
        }
        return;
      }

      // Future: handle client-to-server messages here
    });

    connection.socket.on('close', () => {
      clearTimeout(timeout);
      if (authenticated) {
        removeConnection(userId, connection);
        request.log.info({ userId }, 'WebSocket disconnected');
      }
    });
  });
}
