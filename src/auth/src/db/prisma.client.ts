import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../../generated/prisma/client.js';
import { getDataBaseConfig } from '../config/db.js';

let prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient { 
  if (!prisma) {
    const connectionString = getDataBaseConfig();
    const adapter = new PrismaBetterSqlite3({ url: connectionString });
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}