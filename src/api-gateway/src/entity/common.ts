// Type definitions for the API Gateway

export interface ServiceConfig {
  name: string;
  upstream: string;
  prefix: string;
  rewritePrefix?: string;
  timeout?: number;
  retries?: number;
  // Route configuration
  requiresAuth?: boolean; // Whether this service requires authentication
  requiresAuthRoles?: string[]; // Optional: specific roles required (only if requiresAuth is true)
  websocket?: boolean; // Whether this service supports WebSocket connections
  websocketPath?: string; // Optional: custom WebSocket path (defaults to prefix if websocket is true)
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
  global: {
    max: number;
    timeWindow: string;
  };
  authenticated: {
    max: number;
    timeWindow: string;
  };
  endpoints: Record<
    string,
    {
      max: number;
      timeWindow: string;
    }
  >;
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
