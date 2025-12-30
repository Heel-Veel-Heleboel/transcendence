import 'dotenv/config';
import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import websocket from '@fastify/websocket';
import { proxyRoutes } from './routes/proxy';
import { healthRoutes } from './routes/health';
import { helmetConfig, corsConfig, getBodyLimit, logSecurityConfig } from './config/security';
import { config } from './config';

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
    }, 30000); // 30 seconds
  }

  return server;
};

// Start the server
export const start = async (
  server: Awaited<ReturnType<typeof createServer>>
) => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3002;
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });
    server.log.info(`API Gateway is running on http://${host}:${port}`);
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
