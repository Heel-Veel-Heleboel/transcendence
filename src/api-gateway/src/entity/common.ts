// Type definitions for the API Gateway

/**
 * Security-related constants
 */
export const SECURITY_CONSTANTS = {
  // Body size limits
  DEFAULT_BODY_LIMIT_BYTES: 1048576, // 1MB in bytes
  BYTES_PER_MB: 1048576,

  // HSTS (HTTP Strict Transport Security) configuration
  DEFAULT_HSTS_MAX_AGE_SECONDS: 31536000, // 1 year in seconds
  SECONDS_PER_YEAR: 31536000,

  // Port range validation
  MIN_PORT: 1,
  MAX_PORT: 65535
} as const;

export interface RateLimitEntry {
  max: number;
  timeWindow: string;
}

export interface ServiceConfig {
  name: string;
  upstream: string;
  prefix?: string;
  rewritePrefix?: string;
  timeout?: number;
  retries?: number;
  requiresAuth?: boolean;
  websocket?: boolean;
}

export interface GatewayConfig {
  port: number;
  host: string;
  nodeEnv: string;
  jwtPublicKey: string;
  services: ServiceConfig[];
  rateLimits: RateLimitConfig;
}

export interface RateLimitConfig {
  global: RateLimitEntry;
  authenticated: RateLimitEntry;
  endpoints: Record<string, RateLimitEntry>;
}

export interface JWTPayload {
  sub: number;
  user_email: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface AuthenticatedRequest {
  user?: JWTPayload;
}

export interface ServiceHealth {
  service: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  timestamp: string;
  responseTime?: number;
  error?: string;
}

export interface StandardError {
  statusCode: number;
  error: string;
  message: string;
  correlationId?: string;
  timestamp: string;
}
