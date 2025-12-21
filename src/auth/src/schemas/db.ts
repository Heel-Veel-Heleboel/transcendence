import * as z from 'zod';



export const databaseUrlSchema = z
  .string()
  .nonempty('DATABASE_URL cannot be empty')
  .startsWith('file:', 'DATABASE_URL must start with "file:"')
  .refine(
    (url) => url.length > 5, 
    'DATABASE_URL must specify a path after "file:"'
  );