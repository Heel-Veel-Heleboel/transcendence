//server
import fastify from 'fastify';

//routes
import { userRoutes } from './routes/user.js';
import { profileRoutes } from './routes/profile.js';

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

const { userController, profController } = composeDependencies();

app.setErrorHandler(errorHandler);
app.addHook('onClose', prismaDisconnectHook);
app.get('/health', async () => {
  return { status: 'ok' };
});

app.register(multipart);

const upload_dir = process.env.UPLOAD_DIR || 'uploads';
const prefix = process.env.PREFIX || '/uploads/';
app.register(fastifyStatic, {
  root: path.join(process.cwd(), upload_dir),
  prefix: prefix
});

app.register(userRoutes, { prefix: '/users', userController });
app.register(profileRoutes, { prefix: '/profile', profController });
app.ready((err) => {
  if (err) {
    app.log.error({ err }, 'Error during app readiness:');
    process.exit(1);
  }
  app.log.info('User routes registered');
  app.log.info('Profile routes registered');
  app.log.info('User management service is ready');
});

export default app;


