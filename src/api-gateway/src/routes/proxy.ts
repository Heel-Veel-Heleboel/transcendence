import {
  FastifyInstance,
  FastifyRequest,
  FastifyReply
} from 'fastify';
import httpProxy from '@fastify/http-proxy';
import { config } from '../config';
import { authGuard } from '../middleware/auth';
import { setupProxyErrorHandler } from './errorHandler';
import { ServiceConfig } from '../entity/common';
import type { ExtendedHttpProxyOptions } from '../entity/types';

/**
 * Main function to register all proxy routes
 * Sets up error handler first, then registers all service proxies
 */
export async function proxyRoutes(fastify: FastifyInstance): Promise<void> {
  // Setup global error handler before registering routes
  setupProxyErrorHandler(fastify);

  // Register all service proxies
  await Promise.all(
    config.services.map(service => registerServiceProxy(fastify, service))
  );
}

/**
 * Register HTTP proxy and related hooks for a single service
 */
async function registerServiceProxy(
  fastify: FastifyInstance,
  service: ServiceConfig
): Promise<void> {
  await fastify.register(async function serviceProxy(fastify) {
    // Hook execution order is important:
    // 1. onRequest hooks run first - store service info
    // 2. preHandler hooks run after routing - auth, then header forwarding
    setupServiceHooks(fastify, service);        // onRequest - runs first
    setupServiceAuth(fastify, service);         // preHandler - auth guard
    setupHeaderForwardingHooks(fastify, service); // preHandler - forward headers
    await registerHttpProxy(fastify, service);
  });
}

/**
 * Setup authentication guard for a service if required
 */
function setupServiceAuth(
  fastify: FastifyInstance,
  service: ServiceConfig
): void {
  if (service.requiresAuth) {
    fastify.addHook('preHandler', authGuard());
  }
}

/**
 * Setup service-specific hooks (e.g., storing service info on request)
 */
function setupServiceHooks(
  fastify: FastifyInstance,
  service: ServiceConfig
): void {
  fastify.addHook(
    'onRequest',
    async (_request: FastifyRequest, _reply: FastifyReply) => {
      // Store service info on request for later use
      _request.serviceInfo = service;
    }
  );
}

/**
 * Register HTTP proxy for a service
 */
async function registerHttpProxy(
  fastify: FastifyInstance,
  service: ServiceConfig
): Promise<void> {
  const proxyOptions: ExtendedHttpProxyOptions = {
    upstream: service.upstream,
    prefix: service.prefix,
    rewritePrefix: service.rewritePrefix || '',
    proxyTimeout: service.timeout ?? 5000,
    timeout: service.timeout ?? 5000,
    // Enable websocket proxying if service supports it
    websocket: service.websocket ?? false
  };

  await fastify.register(httpProxy, proxyOptions);
}

/**
 * Setup hooks for forwarding user context and correlation ID
 */
function setupHeaderForwardingHooks(
  fastify: FastifyInstance,
  service: ServiceConfig
): void {
  fastify.addHook(
    'preHandler',
    async (_request: FastifyRequest, _reply: FastifyReply) => {
      if (_request.user) {
        _request.log.info(
          {
            userId: _request.user.sub,
            email: _request.user.email,
            role: _request.user.role,
            service: service.name
          },
          'Forwarding user context to downstream service'
        );
      }
      if (_request.correlationId) {
        _request.log.info(
          {
            correlationId: _request.correlationId,
            service: service.name
          },
          'Forwarding correlation ID'
        );
      }
    }
  );
}

/**
 * Find service configuration by request URL
 */
function findServiceByUrl(url: string | undefined): ServiceConfig | undefined {
  if (!url) return undefined;
  return config.services.find(s => s.prefix && url.startsWith(s.prefix));
}

export {
  registerServiceProxy,
  setupServiceAuth,
  setupServiceHooks,
  registerHttpProxy,
  setupHeaderForwardingHooks,
  findServiceByUrl
};
