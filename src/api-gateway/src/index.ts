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

const server = createServer();

// Start the server
const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3002;
    const host = process.env.HOST || '0.0.0.0';

    await server.listen(port, host);
    server.log.info(`API Gateway is running on http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  server.log.info('Received SIGTERM, shutting down gracefully');
  await server.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  server.log.info('Received SIGINT, shutting down gracefully');
  await server.close();
  process.exit(0);
});

start();
