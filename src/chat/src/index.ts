import fastify from 'fastify';
import { getPrismaClient, disconnectPrisma } from './db/prisma.client.js';
import { loggerOptions } from './config/logger.js';
import { createClients } from './config/clients.js';
import { createServices } from './config/services.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerChannelRoutes } from './routes/channels.js';
import { registerMessageRoutes } from './routes/messages.js';
import { registerInternalRoutes } from './routes/internal.js';

const server = fastify({ logger: loggerOptions });
const prisma = getPrismaClient();
const clients = createClients(server.log);
const services = createServices(prisma, clients, server.log);

await registerHealthRoutes(server, prisma);
await registerChannelRoutes(server, services.channelService);
await registerMessageRoutes(server, services.messageService, services.matchAckService);
await registerInternalRoutes(server, services.matchAckService, services.channelService, services.messageService);

const shutdown = async (signal: string) => {
  server.log.info(`Received ${signal}, shutting down gracefully`);
  try {
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
    const port = parseInt(process.env.PORT || '3006', 10);
    await server.listen({ port, host });
    server.log.info(`Chat service listening on ${host}:${port}`);
  } catch (error) {
    server.log.error({ error }, 'Failed to start server');
    process.exit(1);
  }
};

start();
