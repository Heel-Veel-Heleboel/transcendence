import { getPrismaClient } from '../db/prisma-client.js';

export default async function prismaDisconnectHook() {
  const prisma = getPrismaClient();
  await prisma.$disconnect().then(() => {
    console.log('Prisma client disconnected successfully.');
  }).catch((error) => {
    console.error('Error disconnecting Prisma client:', error);
  });
}