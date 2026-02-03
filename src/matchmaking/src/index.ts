import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { getPrismaClient, disconnectPrisma } from './db/prisma.client.js';
import { MatchDao } from './dao/match.js';
import { MatchmakingService } from './services/casual-matchmaking.js';
import { PoolRegistry } from './services/pool-registry.js';
import { MatchReporting } from './services/match-reporting.js';
import { registerMatchmakingRoutes } from './routes/matchmaking.js';
import { registerMatchRoutes } from './routes/match.js';
import { GameMode } from './types/match.js';

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
  contentSecurityPolicy: false, // Disable for API
});

// Initialize services
const prisma = getPrismaClient();
const matchDao = new MatchDao(prisma);

// Create matchmaking pools for each game mode
const classicPool = new MatchmakingService(matchDao, 'classic', server.log);
const powerupPool = new MatchmakingService(matchDao, 'powerup', server.log);

const pools: Record<GameMode, MatchmakingService> = {
  classic: classicPool,
  powerup: powerupPool,
};

// Pool registry to track which pool each user is in
const poolRegistry = new PoolRegistry();

// Match reporting service (for sending results to user management)
// TODO: Replace with actual UserManagementClient when available
const mockUserManagementClient = {
  reportMatchResult: async () => {},
};
const matchReporting = new MatchReporting(matchDao, mockUserManagementClient, server.log);

// Initialize all matchmaking pools
await classicPool.initialize();
await powerupPool.initialize();

// Health check endpoint
server.get('/health', async () => {
  return {
    status: 'healthy',
    service: 'matchmaking-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
});

// Detailed health check (includes database and pool sizes)
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
    service: 'matchmaking-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbHealthy ? 'connected' : 'disconnected',
    pools: {
      classic: classicPool.getPoolSize(),
      powerup: powerupPool.getPoolSize(),
    },
  };
});

// Register routes
await registerMatchmakingRoutes(server, pools, poolRegistry);
await registerMatchRoutes(server, matchDao, matchReporting);
await registerHistoryRoutes(server, matchReporting);

// Graceful shutdown
const shutdown = async (signal: string) => {
  server.log.info(`Received ${signal}, shutting down gracefully`);

  try {
    await classicPool.shutdown();
    await powerupPool.shutdown();
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
    const port = parseInt(process.env.PORT || '3005', 10);

    await server.listen({ port, host });
    server.log.info(`Matchmaking service listening on ${host}:${port}`);
  } catch (error) {
    server.log.error({ error }, 'Failed to start server');
    process.exit(1);
  }
};

start();
