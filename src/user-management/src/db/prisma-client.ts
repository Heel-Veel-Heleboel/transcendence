import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { env } from '../config/env.js';

function getPrismaClient() : PrismaClient {
  const adapter = new PrismaBetterSqlite3({ url: env.DATABASE_URL });
  console.log('Prisma client initialized with database path:', env.DATABASE_URL);
  return new PrismaClient({ adapter });
}

export const prisma = getPrismaClient();