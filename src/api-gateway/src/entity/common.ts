// Type definitions for the API Gateway

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
  jwtSecret: string;
  services: ServiceConfig[];
  rateLimits: RateLimitConfig;
}

export interface RateLimitConfig {
  global: RateLimitEntry;
  authenticated: RateLimitEntry;
  endpoints: Record<string, RateLimitEntry>;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
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
