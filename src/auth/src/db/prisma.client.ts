import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../../generated/prisma/client.js';
import { getDatabaseConfig } from '../config/db.js';

let prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient { 
  if (!prisma) {
    const connectionString = getDatabaseConfig();
    const adapter = new PrismaBetterSqlite3({ url: connectionString });
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}