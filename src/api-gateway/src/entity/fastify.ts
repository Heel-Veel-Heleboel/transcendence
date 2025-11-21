import type { JWTPayload, ServiceConfig } from './common';

// Extend FastifyRequest with application-specific fields
declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
    correlationId?: string;
    serviceInfo?: ServiceConfig;
  }
}

// Typed options for the @fastify/http-proxy plugin as used in this project
export type HttpProxyOptions = {
  upstream: string;
  prefix?: string;
  rewritePrefix?: string;
  proxyTimeout?: number;
  timeout?: number;
};
