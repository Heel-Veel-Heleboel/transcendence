import fastify from 'fastify';
import prismaPlugin from './plugins/prisma-plugin.js';
import authRoutes from './routes/auth.routes.js';

export const app = fastify();


app.register(prismaPlugin);

app.register(authRoutes, { prefix: '/auth' });