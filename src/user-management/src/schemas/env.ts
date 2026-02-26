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
  ),
  PORT: z.string()
    .regex(/^\d+$/, 'PORT must be a number')
    .transform(Number)
    .refine((port) => port > 0 && port <= 65535, {
      message: 'PORT must be between 1 and 65535'
    }),
  
  HOST: z.string()
    .min(1, 'HOST cannot be empty')
    .refine((host) => {
      return /^(localhost|[\w.-]+)$/.test(host);
    }, {
      message: 'HOST must be a valid hostname or IP address'
    }),
  
  AUTH_URL: z.string()
    .url('AUTH_URL must be a valid URL')
    .startsWith('http', 'AUTH_URL must start with http:// or https://')
});