import z from 'zod';
import { databaseUrlSchema } from '../schemas/db.js';
import { clear } from 'console';


let cacheUrl: string | null = null;

export const getDataBaseConfig = (): string => {
  if (cacheUrl) return cacheUrl;
  const url = process.env.DATABASE_URL;
  try {
    cacheUrl = databaseUrlSchema.parse(url);
    return cacheUrl;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid DATABASE_URL: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
};

export const clearDatabaseConfigCache = () => {
  cacheUrl = null;
};  