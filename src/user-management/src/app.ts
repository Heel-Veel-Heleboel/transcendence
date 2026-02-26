import fastify from 'fastify';
import { userRoutes } from './routes/user.js';
import { errorHandler } from './middleware/error-handler.js';
import prismaDisconnectHook from './middleware/prisma-disconnect-hook.js';
import { getUserController } from './config/user.controllers.js';

const isDevelopment = process.env.NODE_ENV !== 'production';
const app = fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: isDevelopment
      ? {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          colorize: true,
          singleLine: false
        }
      }
      : undefined
  }
});

const userController = getUserController();
app.setErrorHandler(errorHandler);
app.addHook('onClose', prismaDisconnectHook);
app.get('/health', async () => {
  return { status: 'ok' };
});
app.register(userRoutes, { prefix: '/users', userController }).
  after(() => {
    console.log('User routes registered');
  }).
  ready((err) => {
    if (err) {
      console.error('Error during app readiness:', err);
      process.exit(1);
    }
    console.log('User management service is ready');
  });

export default app;


