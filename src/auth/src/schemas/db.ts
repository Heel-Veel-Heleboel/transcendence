import * as z from 'zod';



export const databaseUrlSchema = z
  .string()
  .nonempty('DATABASE_URL cannot be empty')
  .refine(
    (url) => url === 'file::memory:' || (url.startsWith('file:') && url.length > 5),
    'DATABASE_URL must be "file::memory:" or start with "file:" and specify a path'
  );