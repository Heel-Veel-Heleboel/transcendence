import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../../generated/prisma/client.js';
import { getDataBaseConfig } from '../config/db.js';


const connectionString = getDataBaseConfig();
/**
 * Prisma client instance configured with better-sqlite3 adapter.
 * Uses SQLite database via better-sqlite3 for improved performance.
 */
const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });
export { prisma };