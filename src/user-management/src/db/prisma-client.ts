import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { ConfigurationErrors } from '../constants/error-messages.js';

let prisma: PrismaClient | null = null;

export function getPrismaClient() : PrismaClient {
  if (prisma) {
    return (prisma);
  }
  const db_path = process.env.DATABASE_URL;
  if (!db_path) {
    throw new Error(ConfigurationErrors.envVariableNotSet('DATABASE_URL'));
  }
  const adapter = new PrismaBetterSqlite3({ url: db_path });
  prisma = new PrismaClient({ adapter });
  console.log('Prisma client initialized with database path:', db_path);
  return prisma;
}


