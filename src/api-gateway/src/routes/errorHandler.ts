import {
  FastifyError,
  FastifyRequest,
  FastifyReply,
  FastifyInstance
} from 'fastify';
import type { StandardError, ServiceConfig } from '../entity/common';

// Global error handler
export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  const correlationId = (request as any).correlationId;

  // Log the error
  request.log.error(
    {
      error: error.message,
      stack: error.stack,
      correlationId,
      url: request.url,
      method: request.method
    },
    'Request error'
  );

  // Determine status code
  const statusCode = error.statusCode || 500;

  // Create standardized error response
  const errorResponse: StandardError = {
    statusCode,
    error: getErrorName(statusCode),
    message: error.message || 'Internal Server Error',
    correlationId,
    timestamp: new Date().toISOString()
  };

  // Don't expose internal errors in production
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    errorResponse.message = 'Internal Server Error';
  }

  reply.code(statusCode).send(errorResponse);
}

function getErrorName(statusCode: number): string {
  switch (statusCode) {
  case 400:
    return 'Bad Request';
  case 401:
    return 'Unauthorized';
  case 403:
    return 'Forbidden';
  case 404:
    return 'Not Found';
  case 409:
    return 'Conflict';
  case 422:
    return 'Unprocessable Entity';
  case 429:
    return 'Too Many Requests';
  case 500:
    return 'Internal Server Error';
  case 502:
    return 'Bad Gateway';
  case 503:
    return 'Service Unavailable';
  case 504:
    return 'Gateway Timeout';
  default:
    return 'Error';
  }
}

// Custom error classes
export class ValidationError extends Error {
  statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  statusCode = 401;

  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  statusCode = 403;

  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class ServiceUnavailableError extends Error {
  statusCode = 503;

  constructor(service: string) {
    super(`${service} is currently unavailable`);
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * Setup global error handler for proxy routes
 */
export function setupProxyErrorHandler(fastify: FastifyInstance): void {
  fastify.setErrorHandler(
    (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
      //      const service = findServiceByUrl(request.url); replace the stub after the PR is merged
      const service = 'stub' as unknown as ServiceConfig;
      if (service && !reply.sent) {
        handleProxyError(error, service, request, reply);
      } else if (!reply.sent) {
        handleGenericError(error, request, reply);
      }
    }
  );
}

/**
 * Handle proxy-specific errors
 */
export function handleProxyError(
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
export function handleGenericError(
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
