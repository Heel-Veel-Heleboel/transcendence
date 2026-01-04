import fastify from 'fastify';
import httpProxy from '@fastify/http-proxy';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import websocket from '@fastify/websocket';
import { setupProxyErrorHandler } from './routes/errorHandler';
import { helmetConfig, corsConfig, getBodyLimit } from './config/security';
import { getLoggerConfig } from './utils/logger';

// Create Fastify instance with logging and security configuration
export const createServer = async () => {
  const server = fastify({
    logger: getLoggerConfig(),
    bodyLimit: getBodyLimit()
  });

  // Register Helmet for security headers
  await server.register(helmet, helmetConfig);

  // Register CORS plugin
  await server.register(cors, corsConfig);

  // Register WebSocket support
  await server.register(websocket);

  // Setup global error handler for proxy routes
  setupProxyErrorHandler(server);

  // Basic health check endpoint
  server.get('/health', async (_request, _reply) => {
    return { status: 'healthy', timestamp: new Date().toISOString() };
  });

  server.register(httpProxy, {
    upstream: 'http://localhost:3001',
    prefix: '/api/test',
    rewritePrefix: '/test'
  });

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
