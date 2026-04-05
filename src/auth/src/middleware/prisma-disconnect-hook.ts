import { FastifyInstance } from 'fastify';
import { getPrismaClient } from '../db/prisma.client.js';

export default async function prismaDisconnectHook(app: FastifyInstance) {
  const prisma = getPrismaClient();
  await prisma.$disconnect().then(() => {
    app.log.info('Prisma client disconnected successfully.');
  }).catch((error: unknown) => {
    app.log.error({ error }, 'Error disconnecting Prisma client');
  });
}