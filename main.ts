import fastify from 'fastify';

// Create Fastify instance with logging
const server = fastify({
  logger: {
    level: 'info',
    prettyPrint: {
      colorize: true
    }
  }
});

// Basic health check endpoint
server.get('/health', async (request, reply) => {
  return { status: 'healthy', timestamp: new Date().toISOString() };
});

server.register(require('fastify-http-proxy'), {
  upstream: 'http://localhost:3001',
  prefix: '/api/test',
  rewritePrefix: '/test',
});

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
