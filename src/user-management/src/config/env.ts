import { EnvSchema } from '../schemas/env.js';
import { ConfigurationErrors } from '../constants/error-messages.js';

export function validateEnv() {
  const parsedEnv = EnvSchema.safeParse(process.env);
  if (!parsedEnv.success) {
    console.error('❌ Invalid environment variables:', parsedEnv.error);
    throw new Error(ConfigurationErrors.ENV_VALIDATION_FAILED);
  }
  return parsedEnv.data;
}

export const env  = validateEnv();