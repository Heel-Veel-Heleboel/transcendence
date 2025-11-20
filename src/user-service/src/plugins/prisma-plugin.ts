import { PrismaClient } from '@prisma/client';
import fp from 'fastify-plugin';

export const prisma = new PrismaClient();

export default fp(async (fastify) => {
  fastify.decorate('prisma', prisma);
});
