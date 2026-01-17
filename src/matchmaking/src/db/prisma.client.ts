import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../../generated/prisma/index.js';

let prisma: PrismaClient | null = null;

/**
 * Get Prisma Client singleton instance
 * Lazy-loads the client on first call
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    const databaseUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';
    const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

/**
 * Disconnect Prisma Client
 * Used during graceful shutdown
 */
export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}
