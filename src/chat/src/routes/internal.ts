import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ChatService, ChatError } from '../services/chat.js';
import type {
  SendMatchAckRequest,
  CreateGameSessionChannelRequest,
  CreateTournamentChannelRequest,
  SystemMessageRequest,
} from '../types/chat.js';

export async function registerInternalRoutes(
  server: FastifyInstance,
  chatService: ChatService
): Promise<void> {

  /**
   * POST /chat/internal/match-ack
   * Called by matchmaking when a pair is matched.
   * Creates game session channel + ack messages for both players.
   */
  server.post('/chat/internal/match-ack', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as SendMatchAckRequest;

    if (!body.matchId || !body.playerIds || !body.gameMode || !body.expiresAt) {
      return reply.status(400).send({ error: 'matchId, playerIds, gameMode, and expiresAt are required' });
    }

    try {
      const result = await chatService.sendMatchAck(
        body.matchId,
        body.playerIds,
        body.gameMode,
        body.expiresAt
      );
      return reply.status(201).send(result);
    } catch (error) {
      return handleError(request, reply, error);
    }
  });

  /**
   * POST /chat/internal/channels/game-session
   * Called by game service when a match starts.
   */
  server.post('/chat/internal/channels/game-session', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as CreateGameSessionChannelRequest;

    if (!Array.isArray(body.playerIds) || !body.gameSessionId) {
      return reply.status(400).send({ error: 'playerIds and gameSessionId are required' });
    }

    try {
      const channel = await chatService.createGameSessionChannel(body.playerIds, body.gameSessionId);
      return reply.status(201).send(channel);
    } catch (error) {
      return handleError(request, reply, error);
    }
  });

  /**
   * POST /chat/internal/channels/tournament
   * Called by matchmaking when user subscribes to a tournament.
   */
  server.post('/chat/internal/channels/tournament', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as CreateTournamentChannelRequest;

    if (!body.userId || !body.tournamentId || !body.tournamentName) {
      return reply.status(400).send({ error: 'userId, tournamentId, and tournamentName are required' });
    }

    try {
      const channel = await chatService.createTournamentChannel(
        body.userId,
        body.tournamentId,
        body.tournamentName
      );
      return reply.status(201).send(channel);
    } catch (error) {
      return handleError(request, reply, error);
    }
  });

  /**
   * POST /chat/internal/channels/:channelId/system-message
   * Post a system message to a channel (for tournament notifications, etc.)
   */
  server.post('/chat/internal/channels/:channelId/system-message', async (request: FastifyRequest, reply: FastifyReply) => {
    const { channelId } = request.params as { channelId: string };
    const { content } = request.body as SystemMessageRequest;

    if (!content || typeof content !== 'string') {
      return reply.status(400).send({ error: 'content is required' });
    }

    try {
      const message = await chatService.sendSystemMessage(channelId, content);
      return reply.status(201).send(message);
    } catch (error) {
      return handleError(request, reply, error);
    }
  });
}

function handleError(request: FastifyRequest, reply: FastifyReply, error: unknown) {
  if (error instanceof ChatError) {
    return reply.status(error.statusCode).send({ error: error.message });
  }
  request.log.error({ error }, 'Unhandled error in internal route');
  return reply.status(500).send({ error: 'Internal Server Error' });
}
