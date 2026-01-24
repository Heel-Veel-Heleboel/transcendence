import fastify from 'fastify';
import { authRoutes } from './routes/auth.js';
import { authErrorHandler } from './middleware/error-handler.js';
import prismaDisconnectHook from './middleware/prisma-disconnect-hook.js';
import { getAuthController } from './config/auth.js';

const authController = getAuthControllers]();

const app = fastify({
  logger: true
});

app.setErrorHandler(authErrorHandler);
app.addHook('onClose', prismaDisconnectHook);
app.get('/health', async () => {
  return { status: 'ok' };
});
app.register(authRoutes, { prefix: '/auth', authController }).
  after(() => {
    console.log('Auth routes registered');
  }).
  ready((err) => {
    if (err) {
      console.error('Error during app readiness:', err);
      process.exit(1);
    }
    console.log('Auth service is ready');
  });


export default app;