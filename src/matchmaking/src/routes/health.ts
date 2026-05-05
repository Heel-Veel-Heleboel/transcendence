import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '../../generated/prisma/index.js';
import type { Services } from '../config/services.js';

export async function registerHealthRoutes(
  server: FastifyInstance,
  prisma: PrismaClient,
  services: Pick<Services, 'pools' | 'scheduler'>
) {
  server.get('/health', async () => ({
    status: 'healthy',
    service: 'matchmaking-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }));

  server.get('/health/detailed', async () => {
    let dbHealthy = false;
    try {
      await prisma.match.findFirst({ select: { id: true } });
      dbHealthy = true;
    } catch (error) {
      server.log.error({ error }, 'Database health check failed');
    }

    const { pools, scheduler } = services;
    const timerCounts = scheduler.getTimerCounts();

    return {
      status: dbHealthy ? 'healthy' : 'degraded',
      service: 'matchmaking-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbHealthy ? 'connected' : 'disconnected',
      poolSize: {
        classic: pools.classic.getPoolSize(),
        powerup: pools.powerup.getPoolSize(),
        total: pools.classic.getPoolSize() + pools.powerup.getPoolSize()
      },
      tournaments: {
        activeTimers: timerCounts.tournaments,
        matchTimers: timerCounts.matches
      }
    };
  });
}
