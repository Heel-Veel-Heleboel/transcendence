import fastify from 'fastify';
import { getPrismaClient, disconnectPrisma } from './db/prisma.client.js';
import { loggerOptions } from './config/logger.js';
import { createClients } from './config/clients.js';
import { createServices } from './config/services.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerMatchmakingRoutes } from './routes/matchmaking.js';
import { registerMatchRoutes } from './routes/match.js';
import { registerTournamentRoutes } from './routes/tournament.js';
import { registerDirectChallengeRoutes } from './routes/direct-challenge.js';
import { registerHistoryRoutes } from './routes/history.js';

const server = fastify({ logger: loggerOptions });
const prisma = getPrismaClient();
const clients = createClients(server.log);
const services = await createServices(prisma, clients, server.log);

await registerHealthRoutes(server, prisma, services);
await registerMatchmakingRoutes(server, services.pools, services.poolRegistry, clients.chatServiceClient, clients.gatewayNotificationClient, services.matchDao, services.participantDao);
await registerMatchRoutes(server, services.matchDao, services.tournamentDao, services.matchReporting, clients.gameServerClient, clients.chatServiceClient, clients.gatewayNotificationClient, services.scheduler);
await registerTournamentRoutes(server, services.tournamentService, clients.gatewayNotificationClient, services.scheduler);
await registerDirectChallengeRoutes(server, services.matchDao, clients.chatServiceClient, services.pools, services.poolRegistry);
await registerHistoryRoutes(server, services.matchReporting);

const shutdown = async (signal: string) => {
  server.log.info(`Received ${signal}, shutting down gracefully`);
  try {
    services.scheduler.shutdown();
    await services.pools.classic.shutdown();
    await services.pools.powerup.shutdown();
    await disconnectPrisma();
    await server.close();
    server.log.info('Server closed successfully');
    process.exit(0);
  } catch (error) {
    server.log.error({ error }, 'Error during shutdown');
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

const start = async () => {
  try {
    const host = process.env.HOST || '0.0.0.0';
    const port = parseInt(process.env.PORT || '3005', 10);
    await server.listen({ port, host });
    server.log.info(`Matchmaking service listening on ${host}:${port}`);
  } catch (error) {
    server.log.error({ error }, 'Failed to start server');
    process.exit(1);
  }
};

start();
