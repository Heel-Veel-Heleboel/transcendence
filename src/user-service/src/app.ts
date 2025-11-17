import fastify from 'fastify';
import prismaPlugin from './plugins/prisma-plugin.js';
import authRoutes from './routes/auth.routes.js';

export const app = fastify();

// Register plugins
app.register(prismaPlugin);
// Register routes
app.register(authRoutes, { prefix: '/auth' });