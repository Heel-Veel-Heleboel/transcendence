//server
import fastify from 'fastify';
import { env } from './config/env.js';
//routes
import { userRoutes } from './routes/user.js';
import { profileRoutes } from './routes/profile.js';
import { friendshipRoutes } from './routes/friendship.js';
//hooks
import { errorHandler } from './middleware/error-handler.js';
import prismaDisconnectHook from './middleware/prisma-disconnect-hook.js';
//for avatar
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
//controllers
import { composeDependencies } from './config/set-up-controllers.js';



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

const { userController, profController, friendController } = composeDependencies();

app.setErrorHandler(errorHandler);
app.addHook('onClose', prismaDisconnectHook);
app.get('/health', async () => {
  return { status: 'ok' };
});

app.register(multipart);


app.register(fastifyStatic, {
  root: path.join(process.cwd(), env.UPLOAD_DIR),
  prefix: env.PREFIX
});

app.register(userRoutes, { prefix: '/users', userController });
app.register(profileRoutes, { prefix: '/users/profile', profController });
app.register(friendshipRoutes, { prefix: '/users/friendship', friendController });
app.ready((err) => {
  if (err) {
    app.log.error({ err }, 'Error during app readiness:');
    process.exit(1);
  }
  app.log.info('User routes registered');
  app.log.info('Profile routes registered');
  app.log.info('Friendship routes registered');
  app.log.info('User management service is ready');
});

export default app;


