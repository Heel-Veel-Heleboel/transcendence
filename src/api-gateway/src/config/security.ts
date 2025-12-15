import type { FastifyHelmetOptions } from '@fastify/helmet';
import type { FastifyCorsOptions } from '@fastify/cors';

/**
 * Security configuration for API Gateway
 * Controls Helmet security headers, CORS, and request limits
 */

/**
 * Get HSTS max-age from environment or use default (1 year)
 */
function getHstsMaxAge(): number {
  const envValue = process.env.HSTS_MAX_AGE;
  if (!envValue) return 31536000; // 1 year in seconds

  const parsed = parseInt(envValue, 10);
  if (isNaN(parsed) || parsed < 0) {
    console.warn(`Invalid HSTS_MAX_AGE: ${envValue}, using default 31536000`);
    return 31536000;
  }
  return parsed;
}

/**
 * Get request body size limit from environment or use default (1MB)
 */
export function getBodyLimit(): number {
  const envValue = process.env.BODY_LIMIT_BYTES;
  if (!envValue) return 1048576; // 1MB

  const parsed = parseInt(envValue, 10);
  if (isNaN(parsed) || parsed <= 0) {
    console.warn(`Invalid BODY_LIMIT_BYTES: ${envValue}, using default 1048576`);
    return 1048576;
  }
  return parsed;
}

/**
 * Get CSP directives from environment or use secure defaults
 */
function getCspDirectives() {
  return {
    defaultSrc: process.env.CSP_DEFAULT_SRC?.split(',') || ["'self'"],
    styleSrc: process.env.CSP_STYLE_SRC?.split(',') || ["'self'", "'unsafe-inline'"],
    scriptSrc: process.env.CSP_SCRIPT_SRC?.split(',') || ["'self'"],
    imgSrc: process.env.CSP_IMG_SRC?.split(',') || ["'self'", 'data:', 'https:']
  };
}

/**
 * Get allowed CORS origins from environment or use defaults for development
 */
function getAllowedOrigins(): string[] {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
  }
  return ['http://localhost:8080', 'http://localhost:3000'];
}

/**
 * Get allowed HTTP methods for CORS
 */
function getAllowedMethods(): string[] {
  if (process.env.CORS_ALLOWED_METHODS) {
    return process.env.CORS_ALLOWED_METHODS.split(',').map(method => method.trim());
  }
  return ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
}

/**
 * Get allowed headers for CORS
 */
function getAllowedHeaders(): string[] {
  if (process.env.CORS_ALLOWED_HEADERS) {
    return process.env.CORS_ALLOWED_HEADERS.split(',').map(header => header.trim());
  }
  return ['Content-Type', 'Authorization', 'X-Correlation-Id'];
}

/**
 * Get exposed headers for CORS
 */
function getExposedHeaders(): string[] {
  if (process.env.CORS_EXPOSED_HEADERS) {
    return process.env.CORS_EXPOSED_HEADERS.split(',').map(header => header.trim());
  }
  return ['X-Correlation-Id'];
}

/**
 * Helmet configuration with security headers
 */
export const helmetConfig: FastifyHelmetOptions = {
  contentSecurityPolicy: {
    directives: getCspDirectives()
  },
  hsts: {
    maxAge: getHstsMaxAge(),
    includeSubDomains: process.env.HSTS_INCLUDE_SUBDOMAINS !== 'false', // Default true
    preload: process.env.HSTS_PRELOAD !== 'false' // Default true
  }
};

/**
 * CORS configuration
 */
export const corsConfig: FastifyCorsOptions = {
  origin: getAllowedOrigins(),
  credentials: process.env.CORS_CREDENTIALS !== 'false', // Default true
  methods: getAllowedMethods(),
  allowedHeaders: getAllowedHeaders(),
  exposedHeaders: getExposedHeaders()
};

/**
 * Security configuration summary for logging
 */
export function logSecurityConfig(): void {
  const hstsMaxAge = getHstsMaxAge();
  const bodyLimit = getBodyLimit();

  console.info('Security Configuration:');
  console.info(`  Body Limit: ${bodyLimit} bytes (${(bodyLimit / 1048576).toFixed(2)}MB)`);
  console.info(`  HSTS Max-Age: ${hstsMaxAge} seconds (${(hstsMaxAge / 31536000).toFixed(2)} years)`);
  console.info(`  HSTS Include Subdomains: ${process.env.HSTS_INCLUDE_SUBDOMAINS !== 'false'}`);
  console.info(`  HSTS Preload: ${process.env.HSTS_PRELOAD !== 'false'}`);
  console.info(`  CSP Default-Src: ${getCspDirectives().defaultSrc.join(', ')}`);
  console.info(`  CORS Origins: ${getAllowedOrigins().join(', ')}`);
  console.info(`  CORS Credentials: ${corsConfig.credentials}`);
}
