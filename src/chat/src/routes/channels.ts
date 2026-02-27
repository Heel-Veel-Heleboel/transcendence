import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ChatService, ChatError } from '../services/chat.js';
import type { CreateChannelRequest } from '../types/chat.js';

export async function registerChannelRoutes(
  server: FastifyInstance,
  chatService: ChatService
): Promise<void> {

  /**
   * POST /chat/channels
   * Create a new channel (DM or GROUP)
   */
  server.post('/chat/channels', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(request);
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const body = request.body as CreateChannelRequest;

    if (!body.type || !['DM', 'GROUP'].includes(body.type)) {
      return reply.status(400).send({ error: 'type must be DM or GROUP' });
    }

    try {
      if (body.type === 'DM') {
        if (!body.targetUserId || typeof body.targetUserId !== 'number') {
          return reply.status(400).send({ error: 'targetUserId is required for DM' });
        }
        const channel = await chatService.createDMChannel(userId, body.targetUserId);
        return reply.status(201).send(channel);
      }

      if (!body.name || typeof body.name !== 'string') {
        return reply.status(400).send({ error: 'name is required for GROUP' });
      }
      if (!Array.isArray(body.memberIds)) {
        return reply.status(400).send({ error: 'memberIds must be an array' });
      }

      const channel = await chatService.createGroupChannel(userId, body.name, body.memberIds);
      return reply.status(201).send(channel);
    } catch (error) {
      return handleError(request, reply, error);
    }
  });

  /**
   * GET /chat/channels
   * List all channels for the authenticated user
   */
  server.get('/chat/channels', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(request);
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    try {
      const channels = await chatService.getUserChannels(userId);
      return reply.send(channels);
    } catch (error) {
      return handleError(request, reply, error);
    }
  });

  /**
   * GET /chat/channels/:channelId
   * Get channel details + members
   */
  server.get('/chat/channels/:channelId', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(request);
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const { channelId } = request.params as { channelId: string };

    try {
      const channel = await chatService.getChannel(channelId, userId);
      return reply.send(channel);
    } catch (error) {
      return handleError(request, reply, error);
    }
  });

  /**
   * POST /chat/channels/:channelId/members
   * Add a member to a group channel
   */
  server.post('/chat/channels/:channelId/members', async (request: FastifyRequest, reply: FastifyReply) => {
    const requesterId = getUserId(request);
    if (!requesterId) return reply.status(401).send({ error: 'Unauthorized' });

    const { channelId } = request.params as { channelId: string };
    const { userId } = request.body as { userId: number };

    if (!userId || typeof userId !== 'number') {
      return reply.status(400).send({ error: 'userId is required and must be a number' });
    }

    try {
      await chatService.addMember(channelId, requesterId, userId);
      return reply.status(201).send({ success: true });
    } catch (error) {
      return handleError(request, reply, error);
    }
  });

  /**
   * DELETE /chat/channels/:channelId/members/:userId
   * Remove a member or leave a channel
   */
  server.delete('/chat/channels/:channelId/members/:userId', async (request: FastifyRequest, reply: FastifyReply) => {
    const requesterId = getUserId(request);
    if (!requesterId) return reply.status(401).send({ error: 'Unauthorized' });

    const { channelId, userId } = request.params as { channelId: string; userId: string };
    const targetUserId = parseInt(userId, 10);

    if (isNaN(targetUserId)) {
      return reply.status(400).send({ error: 'Invalid userId' });
    }

    try {
      await chatService.removeMember(channelId, requesterId, targetUserId);
      return reply.status(200).send({ success: true });
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

function handleError(request: FastifyRequest, reply: FastifyReply, error: unknown) {
  if (error instanceof ChatError) {
    return reply.status(error.statusCode).send({ error: error.message });
  }
  request.log.error({ error }, 'Unhandled error in channel route');
  return reply.status(500).send({ error: 'Internal Server Error' });
}
