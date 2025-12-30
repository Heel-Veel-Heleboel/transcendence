import 'dotenv/config';
import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import websocket from '@fastify/websocket';
import { proxyRoutes } from './routes/proxy';
import { healthRoutes } from './routes/health';
import { helmetConfig, corsConfig, getBodyLimit, logSecurityConfig } from './config/security';
import { config } from './config';

const HEALTH_CHECK_INTERVAL = 30000;
let healthCheckInterval: NodeJS.Timeout | null = null;

/**
 * Perform health check on all registered services
 */
async function performHealthCheck(host: string, port: number, logger: { warn: (obj: object, msg: string) => void; error: (obj: object, msg: string) => void }): Promise<void> {
  try {
    const response = await fetch(`http://${host}:${port}/health/detailed`);
    const health = await response.json();

    if (health.status === 'degraded') {
      logger.warn({ services: health.services }, 'Some services are unhealthy');
    }
  } catch (error) {
    logger.error({ error }, 'Background health check failed');
  }
}

// Create Fastify instance with logging and security configuration
export const createServer = async () => {
  const server = fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true
        }
      }
    },
    bodyLimit: getBodyLimit()
  });

  // Register Helmet for security headers
  await server.register(helmet, helmetConfig);

  // Register CORS plugin
  await server.register(cors, corsConfig);

  // Register WebSocket support
  await server.register(websocket);

  // Log security configuration
  logSecurityConfig(server.log);

  // Register health check routes (/health and /health/detailed)
  await healthRoutes(server);

  // Register all service proxy routes from configuration
  await proxyRoutes(server);

  // Start background health checks (every 30 seconds)
  if (config.services && config.services.length > 0) {
    setInterval(async () => {
      try {
        const response = await fetch('http://localhost:3002/health/detailed');
        const health = await response.json();

        if (health.status === 'degraded') {
          server.log.warn({ services: health.services }, 'Some services are unhealthy');
        }
      } catch (error) {
        server.log.error({ error }, 'Background health check failed');
      }
    }, HEALTH_CHECK_INTERVAL); 
  }

  return server;
};

// Start the server
export const start = async (
  server: Awaited<ReturnType<typeof createServer>>
) => {
  try {
    const port = config.port;
    const host = config.host;

    await server.listen({ port, host });
    server.log.info(`API Gateway is running on http://${host}:${port}`);

    if (config.services && config.services.length > 0) {
      await performHealthCheck(host, port, server.log);

      healthCheckInterval = setInterval(() => performHealthCheck(host, port, server.log), HEALTH_CHECK_INTERVAL);

      server.log.info({ interval: HEALTH_CHECK_INTERVAL }, 'Background health checks started');
    }

    return server;
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Handle graceful shutdown
export const setupGracefulShutdown = (
  server: Awaited<ReturnType<typeof createServer>>
) => {
  const handleShutdown = async (signal: string) => {
    server.log.info(`Received ${signal}, shutting down gracefully`);

    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
      healthCheckInterval = null;
      server.log.info('Background health checks stopped');
    }

    await server.close();
    process.exit(0);
  };

  ['SIGTERM', 'SIGINT'].forEach(signal => process.on(signal, async () => await handleShutdown(signal)));
};

// Run only when not in test mode
if (process.env.NODE_ENV !== 'test') {
  (async () => {
    const server = await createServer();
    setupGracefulShutdown(server);
    await start(server);
  })();
}
