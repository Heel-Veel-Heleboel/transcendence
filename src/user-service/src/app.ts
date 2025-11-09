import fastify from 'fastify';
import prismaPlugin from './plugins/prisma-plugin';
import authRoutes from './routes/auth.routes';

export const app = fastify();

// Register plugins
app.register(prismaPlugin);
// Register routes
app.register(authRoutes, { prefix: '/auth' });