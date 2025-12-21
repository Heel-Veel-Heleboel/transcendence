import type { FastifyHelmetOptions } from '@fastify/helmet';
import type { FastifyCorsOptions } from '@fastify/cors';
import { SECURITY_CONSTANTS } from '../entity/common';

/**
 * Security configuration for API Gateway
 *
 * This module provides centralized security configuration including:
 * - Helmet security headers (CSP, HSTS, X-Frame-Options, etc.)
 * - CORS (Cross-Origin Resource Sharing) policies
 * - Request body size limits
 *
 * All settings can be configured via environment variables with secure defaults.
 */

/**
 * Safely parse a positive integer from string
 *
 * @param value - String value to parse
 * @param fieldName - Name of the field for error messages
 * @returns Parsed integer or null if invalid
 */
function safeParsePositiveInt(value: string, fieldName: string): number | null {
  try {
    // Check for non-numeric characters (parseInt allows trailing non-digits)
    if (!/^\d+$/.test(value.trim())) {
      console.warn(`Invalid ${fieldName}: "${value}" contains non-numeric characters`);
      return null;
    }

    const parsed = parseInt(value, 10);

    if (isNaN(parsed) || parsed <= 0 || !Number.isSafeInteger(parsed)) {
      console.warn(`Invalid ${fieldName}: "${value}" must be a positive integer`);
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn(`Error parsing ${fieldName}: ${value}`, error);
    return null;
  }
}

/**
 * Get HSTS max-age from environment or use default (1 year)
 *
 * HSTS (HTTP Strict Transport Security) tells browsers to only connect via HTTPS.
 * This prevents protocol downgrade attacks and cookie hijacking.
 *
 * Environment variable: HSTS_MAX_AGE
 * Default: 31536000 seconds (1 year)
 */
function getHstsMaxAge(): number {
  const envValue = process.env.HSTS_MAX_AGE;
  if (!envValue) return SECURITY_CONSTANTS.DEFAULT_HSTS_MAX_AGE_SECONDS;

  const parsed = safeParsePositiveInt(envValue, 'HSTS_MAX_AGE');
  if (parsed === null) {
    console.warn(`Using default HSTS_MAX_AGE: ${SECURITY_CONSTANTS.DEFAULT_HSTS_MAX_AGE_SECONDS}`);
    return SECURITY_CONSTANTS.DEFAULT_HSTS_MAX_AGE_SECONDS;
  }

  return parsed;
}

/**
 * Get request body size limit from environment or use default (1MB)
 *
 * Limits the size of incoming request bodies to prevent:
 * - DoS attacks via large payloads
 * - Memory exhaustion
 * - Application crashes
 *
 * Environment variable: BODY_LIMIT_BYTES
 * Default: 1048576 bytes (1MB)
 */
export function getBodyLimit(): number {
  const envValue = process.env.BODY_LIMIT_BYTES;
  if (!envValue) return SECURITY_CONSTANTS.DEFAULT_BODY_LIMIT_BYTES;

  const parsed = safeParsePositiveInt(envValue, 'BODY_LIMIT_BYTES');
  if (parsed === null) {
    console.warn(`Using default BODY_LIMIT_BYTES: ${SECURITY_CONSTANTS.DEFAULT_BODY_LIMIT_BYTES}`);
    return SECURITY_CONSTANTS.DEFAULT_BODY_LIMIT_BYTES;
  }

  return parsed;
}

/**
 * Get CSP directives from environment or use secure defaults
 *
 * Content Security Policy (CSP) prevents XSS attacks by controlling which resources
 * the browser can load and execute.
 *
 * Environment variables:
 * - CSP_DEFAULT_SRC: Default source for all directives (default: 'self')
 * - CSP_STYLE_SRC: Allowed stylesheet sources (default: 'self')
 * - CSP_SCRIPT_SRC: Allowed script sources (default: 'self')
 * - CSP_IMG_SRC: Allowed image sources (default: 'self', data:, https:)
 *
 * Note: 'unsafe-inline' is NOT included by default for security.
 * If you need inline styles/scripts, explicitly set it via environment variables.
 */
function getCspDirectives() {
  return {
    defaultSrc: process.env.CSP_DEFAULT_SRC?.split(',').map(s => s.trim()) || ['\'self\''],
    styleSrc: process.env.CSP_STYLE_SRC?.split(',').map(s => s.trim()) || ['\'self\''],
    scriptSrc: process.env.CSP_SCRIPT_SRC?.split(',').map(s => s.trim()) || ['\'self\''],
    imgSrc: process.env.CSP_IMG_SRC?.split(',').map(s => s.trim()) || ['\'self\'', 'data:', 'https:']
  };
}

/**
 * Get allowed CORS origins from environment or use defaults for development
 *
 * CORS (Cross-Origin Resource Sharing) controls which domains can make requests
 * to your API. This prevents unauthorized websites from accessing your API.
 *
 * Environment variable: ALLOWED_ORIGINS (comma-separated)
 * Default: http://localhost:8080, http://localhost:3000
 *
 * Production example: ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
 */
function getAllowedOrigins(): string[] {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
  }
  return ['http://localhost:8080', 'http://localhost:3000'];
}

/**
 * Get allowed HTTP methods for CORS
 *
 * Restricts which HTTP methods cross-origin requests can use.
 *
 * Environment variable: CORS_ALLOWED_METHODS (comma-separated)
 * Default: GET, POST, PUT, DELETE, PATCH, OPTIONS
 */
function getAllowedMethods(): string[] {
  if (process.env.CORS_ALLOWED_METHODS) {
    return process.env.CORS_ALLOWED_METHODS.split(',').map(method => method.trim());
  }
  return ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
}

/**
 * Get allowed headers for CORS
 *
 * Specifies which request headers are allowed in cross-origin requests.
 *
 * Environment variable: CORS_ALLOWED_HEADERS (comma-separated)
 * Default: Content-Type, Authorization, X-Correlation-Id
 */
function getAllowedHeaders(): string[] {
  if (process.env.CORS_ALLOWED_HEADERS) {
    return process.env.CORS_ALLOWED_HEADERS.split(',').map(header => header.trim());
  }
  return ['Content-Type', 'Authorization', 'X-Correlation-Id'];
}

/**
 * Get exposed headers for CORS
 *
 * Specifies which response headers are exposed to the browser.
 * By default, browsers only expose simple headers (Cache-Control, Content-Language, etc.).
 *
 * Environment variable: CORS_EXPOSED_HEADERS (comma-separated)
 * Default: X-Correlation-Id
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
 *
 * Logs all active security settings on server startup for audit purposes.
 */
export function logSecurityConfig(): void {
  const hstsMaxAge = getHstsMaxAge();
  const bodyLimit = getBodyLimit();

  console.info('Security Configuration:');
  console.info(`  Body Limit: ${bodyLimit} bytes (${(bodyLimit / SECURITY_CONSTANTS.BYTES_PER_MB).toFixed(2)}MB)`);
  console.info(`  HSTS Max-Age: ${hstsMaxAge} seconds (${(hstsMaxAge / SECURITY_CONSTANTS.SECONDS_PER_YEAR).toFixed(2)} years)`);
  console.info(`  HSTS Include Subdomains: ${process.env.HSTS_INCLUDE_SUBDOMAINS !== 'false'}`);
  console.info(`  HSTS Preload: ${process.env.HSTS_PRELOAD !== 'false'}`);
  console.info(`  CSP Default-Src: ${getCspDirectives().defaultSrc.join(', ')}`);
  console.info(`  CORS Origins: ${getAllowedOrigins().join(', ')}`);
  console.info(`  CORS Credentials: ${corsConfig.credentials}`);
}
