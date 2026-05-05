import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MatchAckService } from '../services/match-ack.js';
import { ChannelService } from '../services/channel.js';
import { MessageService } from '../services/message.js';
import { ChatError, type SendMatchAckRequest, type CreateTournamentChannelRequest, type SystemMessageRequest } from '../types/chat.js';

export async function registerInternalRoutes(
  server: FastifyInstance,
  matchAckService: MatchAckService,
  channelService: ChannelService,
  messageService: MessageService
): Promise<void> {

  server.post('/chat/internal/match-ack', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as SendMatchAckRequest;

    if (!body.matchId || !body.playerIds || !body.gameMode || !body.expiresAt) {
      return reply.status(400).send({ error: 'matchId, playerIds, gameMode, and expiresAt are required' });
    }

    try {
      const result = await matchAckService.sendMatchAck(
        body.matchId,
        body.playerIds,
        body.gameMode,
        body.expiresAt,
        body.tournamentId,
        body.tournamentName,
        body.challengerUsername
      );
      request.log.info(
        { matchId: body.matchId, channelId: result.channel.id, messageId: result.message.id, playerIds: body.playerIds },
        'Match ack created'
      );
      return reply.status(201).send(result);
    } catch (error) {
      return handleError(request, reply, error);
    }
  });

  server.post('/chat/internal/channels/tournament', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as CreateTournamentChannelRequest;

    if (!body.userId || !body.tournamentId || !body.tournamentName) {
      return reply.status(400).send({ error: 'userId, tournamentId, and tournamentName are required' });
    }

    try {
      const channel = await channelService.createTournamentChannel(body.userId, body.tournamentId, body.tournamentName);
      return reply.status(201).send(channel);
    } catch (error) {
      return handleError(request, reply, error);
    }
  });

  server.post('/chat/internal/channels/:channelId/system-message', async (request: FastifyRequest, reply: FastifyReply) => {
    const { channelId } = request.params as { channelId: string };
    const { content } = request.body as SystemMessageRequest;

    if (!content || typeof content !== 'string') {
      return reply.status(400).send({ error: 'content is required' });
    }

    try {
      const message = await messageService.sendSystemMessage(channelId, content);
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
