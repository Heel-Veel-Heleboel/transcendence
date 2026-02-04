import fastify from 'fastify';
import { authRoutes } from './routes/auth.js';
import { authErrorHandler } from './middleware/error-handler.js';
import prismaDisconnectHook from './middleware/prisma-disconnect-hook.js';
import { getAuthController } from './config/auth.js';
import { AUTH_PREFIX } from './constants/auth.js';
import  cookie  from '@fastify/cookie';

const authController = getAuthController();

const app = fastify({
  logger: true
});

app.register(cookie);
app.setErrorHandler(authErrorHandler);
app.addHook('onClose', prismaDisconnectHook);
app.get('/health', async () => {
  return { status: 'ok' };
});
app.register(authRoutes, { prefix: AUTH_PREFIX, authController }).
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