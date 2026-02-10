import { EnvSchema } from '../schemas/env.js';
import { ConfigurationErrors } from '../constants/error-messages.js';

export function validateEnv() {
  const parsedEnv = EnvSchema.safeParse(process.env);
  if (!parsedEnv.success) {
    const missingVars = parsedEnv.error.issues
      .filter(issue => issue.code === 'invalid_type')
      .map(issue => issue.path.join('.'));
    
    if (missingVars.length > 0) {
      console.error('❌ Missing environment variables:', missingVars);
    }
    
    console.error('❌ Environment validation errors:', parsedEnv.error);
    throw new Error(ConfigurationErrors.ENV_VALIDATION_FAILED);
  }
  return parsedEnv.data;
}

export const env = validateEnv();