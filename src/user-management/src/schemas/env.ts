import { z } from 'zod';
import { ConfigurationErrors } from '../constants/error-messages.js';

const TOTAL_LEN = 'file:'.length + '.db'.length + 1; // minimum length for a valid file-based DB URL
export const  EnvSchema = z.object({
  DATABASE_URL: z.string().min(1, ConfigurationErrors.envVariableNotSet('DATABASE_URL')).refine(
    (url) => {
      if (url === 'file::memory:') {
        return true;
      }
      if (url.startsWith('file:') && url.endsWith('.db') && url.length >= TOTAL_LEN) {
        return true;
      }
      return false;
    },
    { message: ConfigurationErrors.INVALID_DB_NAME }
  )
});