import { GatewayConfig } from '../entity/common';
import { getServicesConfig } from './service';
import { getRateLimitConfig } from './rateLimit';

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
    console.warn(
      '[WARNING] Using default JWT secret. Set JWT_SECRET in environment variables for better security.'
    );
  }
}

// Load configuration from environment variables
export const config: GatewayConfig = {
  port: parseInt(process.env.PORT || '3000'),
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