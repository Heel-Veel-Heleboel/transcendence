import {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
  FastifyPluginAsync
} from 'fastify';
import httpProxy from '@fastify/http-proxy';
import websocket from '@fastify/websocket';
import { config } from '../config';
import { authGuard } from '../middleware/auth';
import { ServiceConfig } from '../entity/common';
import type { HttpProxyOptions } from '../entity/fastify';
import type { WebSocket } from 'ws';

/**
 * Main function to register all proxy routes
 */
export async function proxyRoutes(fastify: FastifyInstance): Promise<void> {
  await registerWebSocketPluginIfNeeded(fastify);

  for (const service of config.services) {
    await registerServiceProxy(fastify, service);
  }
}

/**
 * Register WebSocket plugin if any service requires it
 */
async function registerWebSocketPluginIfNeeded(
  fastify: FastifyInstance
): Promise<void> {
  const hasWebSocketServices = config.services.some(s => s.websocket);
  if (hasWebSocketServices) {
    await fastify.register(websocket);
  }
}

/**
 * Register HTTP proxy and related hooks for a single service
 */
async function registerServiceProxy(
  fastify: FastifyInstance,
  service: ServiceConfig
): Promise<void> {
  await fastify.register(async function serviceProxy(fastify) {
    setupServiceAuth(fastify, service);
    setupServiceHooks(fastify, service);
    await registerHttpProxy(fastify, service);
    setupHeaderForwardingHooks(fastify, service);

    if (service.websocket) {
      registerWebSocketRoute(fastify, service);
    }
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
  const proxy = httpProxy as unknown as FastifyPluginAsync<HttpProxyOptions>;
  await fastify.register(proxy, {
    upstream: service.upstream,
    prefix: service.prefix,
    rewritePrefix: service.rewritePrefix || '',
    proxyTimeout: service.timeout ?? 5000,
    timeout: service.timeout ?? 5000
  });
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
        _request.log.debug(
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
        _request.log.debug(
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
 * Register WebSocket route for a service
 */
function registerWebSocketRoute(
  fastify: FastifyInstance,
  service: ServiceConfig
): void {
  // derive ws path from service prefix; remove optional per-service websocketPath
  const wsPath = service.prefix.replace('/api/', '/ws/');

  fastify.get(wsPath, { websocket: true }, (connection: { socket: any }, req: FastifyRequest) => {
    handleWebSocketConnection(fastify, service, wsPath, connection, req);
  });
}

/**
 * Handle WebSocket connection events
 */
function handleWebSocketConnection(
  fastify: FastifyInstance,
  service: ServiceConfig,
  wsPath: string,
  connection: { socket: WebSocket },
  req: FastifyRequest
): void {
  fastify.log.info(
    {
      service: service.name,
      path: wsPath,
      userId: req.user?.sub
    },
    'WebSocket connection established'
  );

  const socket = connection.socket;

  socket.on('message', (data: Buffer | string) => {
    const messageString = typeof data === 'string' ? data : data.toString();
    fastify.log.debug({ service: service.name, message: messageString }, 'WebSocket message received');
  });

  socket.on('close', () => {
    fastify.log.info({ service: service.name }, 'WebSocket connection closed');
  });

  socket.on('error', (err: Error) => {
    const errMsg = err?.message ?? String(err ?? 'Unknown');
    fastify.log.error({ service: service.name, error: errMsg }, 'WebSocket error');
  });
}

/**
 * Find service configuration by request URL
 */
function findServiceByUrl(url: string | undefined): ServiceConfig | undefined {
  if (!url) return undefined;
  return config.services.find(s => url.startsWith(s.prefix));
}

export {
  registerWebSocketPluginIfNeeded,
  registerServiceProxy,
  setupServiceAuth,
  setupServiceHooks,
  registerHttpProxy,
  setupHeaderForwardingHooks,
  registerWebSocketRoute,
  handleWebSocketConnection,
  findServiceByUrl
};
