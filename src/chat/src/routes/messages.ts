import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MessageService } from '../services/message.js';
import { MatchAckService } from '../services/match-ack.js';
import { ChatError } from '../types/chat.js';
import type { SendMessageRequest, RespondToMatchAckRequest } from '../types/chat.js';

export async function registerMessageRoutes(
  server: FastifyInstance,
  messageService: MessageService,
  matchAckService: MatchAckService
): Promise<void> {

  server.post('/chat/channels/:channelId/messages', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(request);
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const senderUsername = getUsername(request);
    const { channelId } = request.params as { channelId: string };
    const { content } = request.body as SendMessageRequest;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return reply.status(400).send({ error: 'content is required and must be a non-empty string' });
    }

    if (content.length > 2000) {
      return reply.status(400).send({ error: 'message content must be 2000 characters or less' });
    }

    try {
      const message = await messageService.sendMessage(channelId, userId, content.trim(), senderUsername);
      return reply.status(201).send(message);
    } catch (error) {
      return handleError(request, reply, error);
    }
  });

  server.get('/chat/channels/:channelId/messages', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(request);
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const { channelId } = request.params as { channelId: string };
    const query = request.query as { cursor?: string; limit?: string };
    const limit = query.limit ? parseInt(query.limit, 10) : undefined;
    const cursor = query.cursor || undefined;

    try {
      const messages = await messageService.getMessages(channelId, userId, cursor, limit);
      return reply.send(messages);
    } catch (error) {
      return handleError(request, reply, error);
    }
  });

  server.post('/chat/match-ack/:messageId/respond', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(request);
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const { messageId } = request.params as { messageId: string };
    const { acknowledge } = request.body as RespondToMatchAckRequest;

    if (typeof acknowledge !== 'boolean') {
      return reply.status(400).send({ error: 'acknowledge must be a boolean' });
    }

    try {
      const result = await matchAckService.respondToMatchAck(messageId, userId, acknowledge);
      return reply.send(result);
    } catch (error) {
      return handleError(request, reply, error);
    }
  });
}

function getUserId(request: FastifyRequest): number | null {
  const raw = request.headers['x-user-id'];
  if (!raw) return null;
  const id = parseInt(raw as string, 10);
  return isNaN(id) ? null : id;
}

function getUsername(request: FastifyRequest): string | null {
  const raw = request.headers['x-user-name'];
  if (!raw || typeof raw !== 'string') return null;
  return raw;
}

function handleError(request: FastifyRequest, reply: FastifyReply, error: unknown) {
  if (error instanceof ChatError) {
    return reply.status(error.statusCode).send({ error: error.message });
  }
  request.log.error({ error }, 'Unhandled error in message route');
  return reply.status(500).send({ error: 'Internal Server Error' });
}
