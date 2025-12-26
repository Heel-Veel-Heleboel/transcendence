import type { JWTPayload, ServiceConfig } from './common';
import type fastifyHttpProxy from '@fastify/http-proxy';

// Extend FastifyRequest with application-specific fields
declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
    correlationId?: string;
    serviceInfo?: ServiceConfig;
  }
}

// Extract the full options type from @fastify/http-proxy plugin
// This includes the websocket union types (FastifyHttpProxyWebsocketOptionsEnabled | FastifyHttpProxyWebsocketOptionsDisabled)
type FastifyHttpProxyPluginOptions = Parameters<typeof fastifyHttpProxy>[1];

// Extend with custom timeout fields for error handling and retry logic
export type ExtendedHttpProxyOptions = FastifyHttpProxyPluginOptions & {
  proxyTimeout?: number;
  timeout?: number;
};
