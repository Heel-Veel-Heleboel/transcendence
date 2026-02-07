import { z } from 'zod';
import { ConfigurationErrors } from '../constants/error-messages.js';

export const  EnvSchema = z.object({
  DATABASE_URL: z.string().nonempty(ConfigurationErrors.envVariableNotSet('DATABASE_URL')).refine(
    (url) => {
      if (url === 'file::memory:') {
        return true;
      }
      if (url.startsWith('file:') && url.endsWith('.db') && url.length > 8) {
        return true;
      }
      return false;
    },
    { message: ConfigurationErrors.INVALID_DB_NAME }
  )
});