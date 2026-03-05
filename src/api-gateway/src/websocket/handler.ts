import { FastifyInstance } from 'fastify';
import type { RawData } from 'ws';
import { verifyToken } from '../middleware/auth';
import { addConnection, removeConnection } from './connections';

const AUTH_TIMEOUT_MS = 5000;
const MAX_MESSAGE_SIZE = 4096; // 4KB max message size

function rawDataToString(data: RawData): string {
  if (Buffer.isBuffer(data)) return data.toString('utf-8');
  if (data instanceof ArrayBuffer) return Buffer.from(data).toString('utf-8');
  if (Array.isArray(data)) return Buffer.concat(data).toString('utf-8');
  return String(data);
}

export async function websocketRoutes(server: FastifyInstance): Promise<void> {
  server.get('/ws', { websocket: true }, (connection, request) => {
    let authenticated = false;
    let userId: string | undefined;

    const timeout = setTimeout(() => {
      if (!authenticated) {
        request.log.warn('WebSocket auth timeout');
        connection.socket.close(4001, 'Authentication timeout');
      }
    }, AUTH_TIMEOUT_MS);

    connection.socket.on('message', (raw: RawData, isBinary: boolean) => {
      if (isBinary) {
        connection.socket.close(4004, 'Binary frames not supported');
        return;
      }

      const text = rawDataToString(raw);
      if (text.length > MAX_MESSAGE_SIZE) {
        connection.socket.close(4005, 'Message too large');
        return;
      }

      if (!authenticated) {
        try {
          const message = JSON.parse(text);
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
          userId = String(payload.sub);
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

      // Route client messages to backend services
      try {
        const message = JSON.parse(text);

        if (message.type === 'CHAT_SEND' && message.channelId && message.content) {
          const chatServiceUrl = process.env.CHAT_SERVICE_URL || 'http://localhost:3006';
          fetch(`${chatServiceUrl}/chat/channels/${message.channelId}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': userId!
            },
            body: JSON.stringify({ content: message.content })
          }).catch(err => {
            request.log.error({ error: err, userId }, 'Failed to forward chat message');
          });
        }
      } catch {
        request.log.warn({ userId }, 'Invalid WebSocket message format');
      }
    });

    connection.socket.on('close', () => {
      clearTimeout(timeout);
      if (authenticated && userId) {
        removeConnection(userId, connection);
        request.log.info({ userId }, 'WebSocket disconnected');
      }
    });
  });
}
