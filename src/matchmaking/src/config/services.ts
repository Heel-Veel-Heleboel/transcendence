import type { FastifyBaseLogger } from 'fastify';
import type { PrismaClient } from '../../generated/prisma/index.js';
import { MatchDao } from '../dao/match.js';
import { TournamentDao } from '../dao/tournament.js';
import { TournamentParticipantDao } from '../dao/tournament-participant.js';
import { MatchmakingService } from '../services/casual-matchmaking.js';
import { PoolRegistry } from '../services/pool-registry.js';
import { MatchReporting } from '../services/match-reporting.js';
import { TournamentService } from '../services/tournament.js';
import { TournamentLifecycleManager } from '../services/tournament-lifecycle.js';
import type { GameMode } from '../types/match.js';
import type { Clients } from './clients.js';

export async function createServices(prisma: PrismaClient, clients: Clients, log: FastifyBaseLogger) {
  const matchDao = new MatchDao(prisma);
  const tournamentDao = new TournamentDao(prisma);
  const participantDao = new TournamentParticipantDao(prisma);

  const classicPool = new MatchmakingService(matchDao, 'classic', log);
  const powerupPool = new MatchmakingService(matchDao, 'powerup', log);
  const pools: Record<GameMode, MatchmakingService> = { classic: classicPool, powerup: powerupPool };
  const poolRegistry = new PoolRegistry();

  const matchReporting = new MatchReporting(matchDao, clients.userManagementClient, log);

  const tournamentService = new TournamentService(tournamentDao, participantDao, matchDao, log);
  const lifecycleManager = new TournamentLifecycleManager(
    tournamentService,
    tournamentDao,
    matchDao,
    clients.gatewayNotificationClient,
    clients.chatServiceClient,
    undefined,
    log
  );

  await classicPool.initialize();
  await powerupPool.initialize();
  await lifecycleManager.initialize();

  return { matchDao, tournamentDao, participantDao, pools, poolRegistry, matchReporting, tournamentService, lifecycleManager };
}

export type Services = Awaited<ReturnType<typeof createServices>>;
