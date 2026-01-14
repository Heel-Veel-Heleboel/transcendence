import { GatewayConfig } from '../entity/common';
import { getServicesConfig } from './service';
import { getRateLimitConfig } from './rateLimit';
import { logger } from './logger';
import { validatePort } from '../utils/validation';

// Determine JWT secret with proper checks
let jwtSecret: string | undefined = process.env.JWT_SECRET;
const nodeEnv = process.env.NODE_ENV || 'development';
if (!jwtSecret) {
  if (nodeEnv === 'production') {
    throw new Error(
      'JWT_SECRET environment variable must be set in production.'
    );
  } else {
    jwtSecret = 'secret-key-change-in-production';
    logger.warn(
      '[WARNING] Using default JWT secret. Set JWT_SECRET in environment variables for better security.'
    );
  }
}

// Parse and validate port
let port: number;
const portEnv = process.env.PORT || '3000';
try {
  port = validatePort(portEnv, 'PORT');
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.warn({ error: errorMessage, default: 3000 }, 'Invalid PORT, using default 3000');
  port = 3000;
}

// Load configuration from environment variables
export const config: GatewayConfig = {
  port,
  host: process.env.HOST || '0.0.0.0',
  nodeEnv,
  jwtSecret,
  services: getServicesConfig(),
  rateLimits: getRateLimitConfig()
};

// Validate required environment variables
export function validateConfig(): void {
  const required = ['JWT_SECRET'];
  const missing = required.filter(
    key => !process.env[key] && config.nodeEnv === 'production'
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}
