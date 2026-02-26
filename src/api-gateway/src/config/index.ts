import { readFileSync } from 'fs';
import { resolve } from 'path';
import { GatewayConfig } from '../entity/common';
import { getServicesConfig } from './service';
import { getRateLimitConfig } from './rateLimit';
import { logger } from './logger';
import { validatePort } from '../utils/validation';

// Load JWT public key for RS256 verification
const nodeEnv = process.env.NODE_ENV || 'development';
const jwtPublicKeyPath = process.env.JWT_PUBLIC_KEY_PATH || resolve('keys/jwt_public.pem');
let jwtPublicKey: string;
try {
  jwtPublicKey = readFileSync(jwtPublicKeyPath, 'utf-8');
} catch (error: unknown) {
  if (nodeEnv === 'production') {
    throw new Error(`Failed to load JWT public key from ${jwtPublicKeyPath}`);
  }
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.warn({ error: errorMessage }, `[WARNING] Could not load JWT public key from ${jwtPublicKeyPath}. JWT verification will fail.`);
  jwtPublicKey = '';
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
  jwtPublicKey,
  services: getServicesConfig(),
  rateLimits: getRateLimitConfig()
};

// Validate required environment variables
export function validateConfig(): void {
  if (config.nodeEnv === 'production' && !config.jwtPublicKey) {
    throw new Error('JWT public key must be available in production');
  }
}
