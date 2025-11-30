import {
  FastifyError,
  FastifyRequest,
  FastifyReply,
  FastifyInstance
} from 'fastify';
import { STATUS_CODES } from 'http';
import type { StandardError, ServiceConfig } from '../entity/common';

/**
 * Log error details with correlation ID for tracing
 */
function logError(
  request: FastifyRequest,
  error: FastifyError,
  correlationId?: string
): void {
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
}

/**
 * Determine HTTP status code from error
 */
function determineStatusCode(error: FastifyError): number {
  return error.statusCode || 500;
}

/**
 * Get standard HTTP status message from status code
 */
function getErrorName(statusCode: number): string {
  return STATUS_CODES[statusCode] || 'Error';
}

/**
 * Create standardized error response object
 */
function createStandardErrorResponse(
  error: FastifyError,
  statusCode: number,
  correlationId?: string
): StandardError {
  return {
    statusCode,
    error: getErrorName(statusCode),
    message: error.message || 'Internal Server Error',
    correlationId,
    timestamp: new Date().toISOString()
  };
}

/**
 * Obscure internal error messages in production for security
 */
function obscureInternalErrors(errorResponse: StandardError): void {
  if (errorResponse.statusCode === 500 && process.env.NODE_ENV === 'production') {
    errorResponse.message = 'Internal Server Error';
  }
}

/**
 * Global error handler - orchestrates error handling flow
 */
export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  const correlationId = request.correlationId;

  logError(request, error, correlationId);
  const statusCode = determineStatusCode(error);
  const errorResponse = createStandardErrorResponse(error, statusCode, correlationId);
  obscureInternalErrors(errorResponse);

  reply.code(statusCode).send(errorResponse);
}

/**
 * Custom error class for service unavailability
 * Used when upstream services fail or are unreachable
 */
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
