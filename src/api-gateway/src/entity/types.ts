import type { JWTPayload, ServiceConfig } from './common';
import type { FastifyHttpProxyOptions } from '@fastify/http-proxy';

// Extend FastifyRequest with application-specific fields
declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
    correlationId?: string;
    serviceInfo?: ServiceConfig;
  }
}

// Extend @fastify/http-proxy options with custom timeout fields
// These will be used in custom error handling and retry logic
export interface ExtendedHttpProxyOptions extends FastifyHttpProxyOptions {
  proxyTimeout?: number;
  timeout?: number;
}
