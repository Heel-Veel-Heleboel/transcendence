import { FastifyInstance, FastifyRequest, FastifyReply, FastifyBaseLogger } from 'fastify';
import { MatchDao } from '../dao/match.js';
import { TournamentDao } from '../dao/tournament.js';
import { MatchReporting } from '../services/match-reporting.js';
import { TournamentLifecycleManager } from '../services/tournament-lifecycle.js';
import { getUserIdFromHeader } from './request-context.js';
import { GameServerClient } from '../clients/game-server-client.js';
import { ChatServiceClient } from '../clients/chat-service-client.js';
import { GatewayNotificationClient } from '../clients/gateway-notification-client.js';
import type { Match } from '../../generated/prisma/index.js';

async function retryTournamentMatch(
  match: Match,
  deps: {
    matchDao: MatchDao;
    tournamentDao: TournamentDao;
    lifecycleManager?: TournamentLifecycleManager;
    gatewayNotificationClient: GatewayNotificationClient;
    chatServiceClient: ChatServiceClient;
    log: FastifyBaseLogger;
  }
): Promise<Match> {
  const { matchDao, tournamentDao, lifecycleManager, gatewayNotificationClient, chatServiceClient, log } = deps;

  const tournament = await tournamentDao.findById(match.tournamentId!);
  const ackMinutes = tournament?.ackDeadlineMin ?? 20;
  const newDeadline = new Date(Date.now() + ackMinutes * 60 * 1000);
  const resetMatch = await matchDao.resetToPendingAck(match.id, newDeadline);

  lifecycleManager?.onMatchCreated(resetMatch);
  gatewayNotificationClient.notifyUsers(
    [resetMatch.player1Id, resetMatch.player2Id],
    {
      type: 'TOURNAMENT_MATCH_RETRY',
      matchId: match.id,
      tournamentId: resetMatch.tournamentId,
      deadline: newDeadline.toISOString(),
      gameMode: resetMatch.gameMode
    }
  );
  chatServiceClient.sendMatchAck(
    match.id,
    [resetMatch.player1Id, resetMatch.player2Id],
    resetMatch.gameMode,
    newDeadline,
    tournament ? { id: tournament.id, name: tournament.name } : undefined
  ).catch(err => {
    log.error({ err, matchId: match.id }, 'Failed to re-send match-ack after tournament match retry');
  });

  return resetMatch;
}

export async function registerMatchRoutes(
  server: FastifyInstance,
  matchDao: MatchDao,
  tournamentDao: TournamentDao,
  matchReporting: MatchReporting,
  gameServerClient: GameServerClient,
  chatServiceClient: ChatServiceClient,
  gatewayNotificationClient: GatewayNotificationClient,
  lifecycleManager?: TournamentLifecycleManager
): Promise<void> {

  server.post('/matchmaking/match/:matchId/acknowledge', async (request: FastifyRequest, reply: FastifyReply) => {
    const { matchId } = request.params as { matchId: string };
    const userId = getUserIdFromHeader(request);

    if (userId === null) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Missing x-user-id header' });
    }

    try {
      const match = await matchDao.findById(matchId);
      if (!match) {
        return reply.status(404).send({ error: 'Not Found', message: 'Match not found' });
      }
      if (match.player1Id !== userId && match.player2Id !== userId) {
        return reply.status(403).send({ error: 'Forbidden', message: 'You are not a player in this match' });
      }

      const updatedMatch = await matchDao.acknowledge(matchId, userId);
      const bothReady = updatedMatch.player1Acknowledged && updatedMatch.player2Acknowledged;

      let roomId: string | null = null;
      if (bothReady) {
        request.log.info({ matchId, player1Id: updatedMatch.player1Id, player2Id: updatedMatch.player2Id }, 'Both players acknowledged, creating game room');
        try {
          roomId = await gameServerClient.createRoom(updatedMatch);
          await matchDao.setGameSessionId(matchId, roomId);
          gatewayNotificationClient.notifyUsers(
            [updatedMatch.player1Id, updatedMatch.player2Id],
            { type: 'MATCH_READY', matchId, roomId, gameMode: updatedMatch.gameMode }
          );
          chatServiceClient.createGameSessionChannel(
            [updatedMatch.player1Id, updatedMatch.player2Id],
            roomId
          ).catch(err => {
            request.log.error({ err, matchId, roomId }, 'Failed to create game session channel in chat');
          });
        } catch (err) {
          request.log.error({ err, matchId }, 'Failed to create game room after both players acknowledged');
          if (updatedMatch.tournamentId) {
            await retryTournamentMatch(updatedMatch, { matchDao, tournamentDao, lifecycleManager, gatewayNotificationClient, chatServiceClient, log: request.log });
            request.log.info({ matchId }, 'Tournament match reset to PENDING_ACK after game server failure');
          }
          // Casual match stays SCHEDULED — game server crash recovery handles it
        }
      }

      return reply.status(200).send({ success: true, matchId: updatedMatch.id, bothReady, roomId });
    } catch (error) {
      request.log.error({ error, matchId, userId }, 'Error acknowledging match');
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to acknowledge match' });
    }
  });

  server.post('/matchmaking/match/:matchId/decline', async (request: FastifyRequest, reply: FastifyReply) => {
    const { matchId } = request.params as { matchId: string };
    const userId = getUserIdFromHeader(request);

    if (userId === null) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Missing x-user-id header' });
    }

    try {
      const match = await matchDao.findById(matchId);
      if (!match) {
        return reply.status(404).send({ error: 'Not Found', message: 'Match not found' });
      }
      if (match.player1Id !== userId && match.player2Id !== userId) {
        return reply.status(403).send({ error: 'Forbidden', message: 'You are not a player in this match' });
      }
      if (match.status === 'CANCELLED' || match.status === 'FORFEITED') {
        return reply.status(200).send({ success: true, matchId: match.id, status: match.status });
      }
      if (match.status !== 'PENDING_ACKNOWLEDGEMENT') {
        return reply.status(400).send({ error: 'Bad Request', message: `Match is ${match.status}, cannot decline` });
      }

      let updatedMatch;
      if (match.tournamentId) {
        const winnerId = match.player1Id === userId ? match.player2Id : match.player1Id;
        const isPlayer1Declining = match.player1Id === userId;
        updatedMatch = await matchDao.completeMatch(matchId, {
          winnerId,
          player1Score: isPlayer1Declining ? 0 : 5,
          player2Score: isPlayer1Declining ? 5 : 0,
          resultSource: `forfeit:declined:${userId}`
        });
        updatedMatch = await matchDao.updateStatus(matchId, 'FORFEITED');
        lifecycleManager?.onMatchCompleted(updatedMatch).catch(err => {
          request.log.error({ error: err, matchId }, 'Error processing tournament forfeit');
        });
      } else {
        updatedMatch = await matchDao.declineMatch(matchId, userId);
      }

      request.log.info({ matchId, userId, tournament: !!match.tournamentId }, 'Match declined');
      return reply.status(200).send({ success: true, matchId: updatedMatch.id, status: updatedMatch.status });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to decline match';
      request.log.error({ error, matchId, userId }, 'Error declining match');
      return reply.status(500).send({ error: 'Internal Server Error', message });
    }
  });

  server.get('/matchmaking/match/:matchId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { matchId } = request.params as { matchId: string };

    try {
      const match = await matchDao.findById(matchId);
      if (!match) {
        return reply.status(404).send({ error: 'Not Found', message: 'Match not found' });
      }
      return reply.status(200).send(match);
    } catch (error) {
      request.log.error({ error, matchId }, 'Error getting match');
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to get match details' });
    }
  });

  server.post('/matchmaking/match/:matchId/result', async (request: FastifyRequest, reply: FastifyReply) => {
    const { matchId } = request.params as { matchId: string };
    const { winnerId, player1Score, player2Score, isFinished } = request.body as {
      winnerId?: number;
      player1Score?: number;
      player2Score?: number;
      isFinished?: boolean;
    };

    if (isFinished && (!winnerId || player1Score === undefined || player2Score === undefined)) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'winnerId, player1Score, and player2Score are required for finished matches'
      });
    }

    try {
      const match = await matchDao.findById(matchId);
      if (!match) {
        return reply.status(404).send({ error: 'Not Found', message: 'Match not found' });
      }

      if (!isFinished) {
        if (match.tournamentId) {
          await retryTournamentMatch(match, { matchDao, tournamentDao, lifecycleManager, gatewayNotificationClient, chatServiceClient, log: request.log });
          request.log.info({ matchId }, 'Tournament match reset to PENDING_ACK after game crash');
          return reply.status(200).send({ success: true, matchId, status: 'PENDING_ACKNOWLEDGEMENT' });
        }

        const updatedMatch = await matchDao.cancelMatch(matchId, {
          player1Score: player1Score ?? 0,
          player2Score: player2Score ?? 0,
          resultSource: 'game_service_cancelled'
        });
        request.log.info({ matchId, player1Score, player2Score }, 'Match cancelled (premature end)');
        gatewayNotificationClient.notifyUsers([updatedMatch.player1Id, updatedMatch.player2Id], { type: 'MATCH_FINISHED' });
        return reply.status(200).send({ success: true, matchId: updatedMatch.id, status: 'CANCELLED' });
      }

      if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Invalid winnerId' });
      }

      const updatedMatch = await matchDao.completeMatch(matchId, {
        winnerId: winnerId!,
        player1Score: player1Score!,
        player2Score: player2Score!,
        resultSource: 'game_service'
      });

      matchReporting.reportMatchResult(updatedMatch).catch(err => {
        request.log.error({ error: err, matchId }, 'Failed to report match result to user management');
      });
      lifecycleManager?.onMatchCompleted(updatedMatch).catch(err => {
        request.log.error({ error: err, matchId }, 'Error processing tournament match completion');
      });

      request.log.info({ matchId, winnerId, player1Score, player2Score }, 'Match completed');
      gatewayNotificationClient.notifyUsers([updatedMatch.player1Id, updatedMatch.player2Id], { type: 'MATCH_FINISHED' });
      return reply.status(200).send({ success: true, matchId: updatedMatch.id });
    } catch (error) {
      request.log.error({ error, matchId }, 'Error recording match result');
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to record match result' });
    }
  });
}
