import fastify from 'fastify';
import httpProxy from '@fastify/http-proxy';

// Create Fastify instance with logging
export const createServer = () => {
  const server = fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true
        }
      }
    }
  });

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
  server: ReturnType<typeof createServer> = createServer()
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
  server: ReturnType<typeof createServer>
) => {
  const handleShutdown = async (signal: string) => {
    server.log.info(`Received ${signal}, shutting down gracefully`);
    await server.close();
    process.exit(0);
  };

  ['SIGTERM', 'SIGINT'].forEach(signal => process.on(signal, () => handleShutdown(signal)));
};

// Run only when not in test mode
if (process.env.NODE_ENV !== 'test') {
  const server = createServer();
  setupGracefulShutdown(server);
  start(server);
}
