import { prisma } from '../db/prisma-client.js';

export default async function prismaDisconnectHook() {
  await prisma.$disconnect().then(() => {
    console.log('Prisma client disconnected successfully.');
  }).catch((error) => {
    console.error('Error disconnecting Prisma client:', error);
  });
}