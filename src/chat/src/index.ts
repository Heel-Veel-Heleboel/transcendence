import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { getPrismaClient, disconnectPrisma } from './db/prisma.client.js';
import { ChannelDao } from './dao/channel.dao.js';
import { MessageDao } from './dao/message.dao.js';
import { NotificationService } from './services/notification.js';
import { BlockService } from './services/block.js';
import { ChatService } from './services/chat.js';
import { registerChannelRoutes } from './routes/channels.js';
import { registerMessageRoutes } from './routes/messages.js';
import { registerInternalRoutes } from './routes/internal.js';

const server = fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Register plugins
await server.register(cors, {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
});

await server.register(helmet, {
  contentSecurityPolicy: false,
});

// Initialize services
const prisma = getPrismaClient();
const channelDao = new ChannelDao(prisma);
const messageDao = new MessageDao(prisma);
const notificationService = new NotificationService(channelDao, server.log);
const blockService = new BlockService(server.log);
const chatService = new ChatService(channelDao, messageDao, notificationService, blockService, server.log);

// Health checks
server.get('/health', async () => ({
  status: 'healthy',
  service: 'chat-service',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
}));

server.get('/health/detailed', async () => {
  let dbHealthy = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbHealthy = true;
  } catch (error) {
    server.log.error({ error }, 'Database health check failed');
  }

  return {
    status: dbHealthy ? 'healthy' : 'degraded',
    service: 'chat-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbHealthy ? 'connected' : 'disconnected',
  };
});

// Register routes
await registerChannelRoutes(server, chatService);
await registerMessageRoutes(server, chatService);
await registerInternalRoutes(server, chatService);

// Graceful shutdown
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

// Start server
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
