import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '../../generated/prisma/client.js';

export async function registerHealthRoutes(server: FastifyInstance, prisma: PrismaClient) {
  server.get('/health', async () => ({
    status: 'healthy',
    service: 'chat-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }));

  server.get('/health/detailed', async () => {
    let dbHealthy = false;
    try {
      await prisma.channel.count();
      dbHealthy = true;
    } catch (error) {
      server.log.error({ error }, 'Database health check failed');
    }

    return {
      status: dbHealthy ? 'healthy' : 'degraded',
      service: 'chat-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbHealthy ? 'connected' : 'disconnected'
    };
  });
}
