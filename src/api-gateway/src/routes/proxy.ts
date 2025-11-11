import {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
  FastifyError
} from 'fastify';
import httpProxy from '@fastify/http-proxy';
import websocket from '@fastify/websocket';
import { config } from '../config';
import { authGuard } from '../middleware/auth';
import { errorHandler, ServiceUnavailableError } from '../utils/errors';
import { ServiceConfig } from '../entity/common';

/**
 * Main function to register all proxy routes
 */
export async function proxyRoutes(fastify: FastifyInstance): Promise<void> {
  await registerWebSocketPluginIfNeeded(fastify);

  for (const service of config.services) {
    await registerServiceProxy(fastify, service);
  }

  setupProxyErrorHandler(fastify);
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
    fastify.addHook('preHandler', authGuard(service.requiresAuthRoles));
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
      (_request as any).serviceInfo = service;
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
  await fastify.register(httpProxy, {
    upstream: service.upstream,
    prefix: service.prefix,
    rewritePrefix: service.rewritePrefix || ''
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
  const wsPath =
    service.websocketPath || service.prefix.replace('/api/', '/ws/');

  fastify.get(wsPath, { websocket: true }, (connection, req) => {
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
  connection: { socket: any },
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

  connection.socket.on('message', (message: Buffer) => {
    fastify.log.debug(
      {
        service: service.name,
        message: message.toString()
      },
      'WebSocket message received'
    );
  });

  connection.socket.on('close', () => {
    fastify.log.info({ service: service.name }, 'WebSocket connection closed');
  });

  connection.socket.on('error', (error: Error) => {
    fastify.log.error(
      { service: service.name, error: error.message },
      'WebSocket error'
    );
  });
}

/**
 * Setup global error handler for proxy routes
 */
function setupProxyErrorHandler(fastify: FastifyInstance): void {
  fastify.setErrorHandler(
    (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
      const service = findServiceByUrl(request.url);

      if (service && !reply.sent) {
        handleProxyError(error, service, request, reply);
      } else if (!reply.sent) {
        handleGenericError(error, request, reply);
      }
    }
  );
}

/**
 * Find service configuration by request URL
 */
function findServiceByUrl(url: string | undefined): ServiceConfig | undefined {
  if (!url) return undefined;
  return config.services.find(s => url.startsWith(s.prefix));
}

/**
 * Handle proxy-specific errors
 */
function handleProxyError(
  error: FastifyError,
  service: ServiceConfig,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  const proxyError: FastifyError = new ServiceUnavailableError(
    service.name
  ) as FastifyError;
  proxyError.statusCode = 503;

  request.log.error(
    {
      error: error.message,
      service: service.name,
      upstream: service.upstream,
      url: request.url,
      originalError: error.name
    },
    'Proxy error'
  );

  errorHandler(proxyError, request, reply);
}

/**
 * Handle generic/non-proxy errors
 */
function handleGenericError(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  const fastifyError =
    error instanceof Error && 'statusCode' in error
      ? (error as FastifyError)
      : (Object.assign(error, { statusCode: 500 }) as FastifyError);
  errorHandler(fastifyError, request, reply);
}
