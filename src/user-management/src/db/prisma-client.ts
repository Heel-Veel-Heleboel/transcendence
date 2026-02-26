import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { env } from '../config/env.js';

let prismaClient: PrismaClient | null = null;
export function getPrismaClient(): PrismaClient {
  if (prismaClient) {
    return prismaClient;
  }
  const adapter = new PrismaBetterSqlite3({ url: env.DATABASE_URL });
  prismaClient = new PrismaClient({ adapter });
  return prismaClient;
}