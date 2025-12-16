import {
  FastifyError,
  FastifyRequest,
  FastifyReply,
  FastifyInstance
} from 'fastify';
import { STATUS_CODES } from 'http';
import type { StandardError, ServiceConfig } from '../entity/common';
import { findServiceByUrl } from './proxy';

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
 * Sanitization configuration for different status codes
 */
const SANITIZATION_RULES: Record<number, (msg: string) => string> = {
  401: (msg: string) => sanitizeAuthError(msg),
  403: (msg: string) => sanitizeAuthzError(msg),
  400: (msg: string) => sanitizeDatabaseError(msg),
  422: (msg: string) => sanitizeDatabaseError(msg)
};

/**
 * Sanitize authentication errors (401)
 * Only sanitizes when implementation details are exposed
 */
function sanitizeAuthError(message: string): string {
  const lowerMessage = message.toLowerCase();

  const safeMessages = [
    'authentication required',
    'invalid credentials',
    'unauthorized',
    'missing authentication'
  ];

  if (safeMessages.includes(lowerMessage)) {
    return message;
  }

  const sensitiveKeywords = ['jwt', 'bearer', 'token', 'session', 'cookie', 'header'];

  const containsSensitiveInfo = sensitiveKeywords.some(keyword =>
    lowerMessage.includes(keyword)
  );

  return containsSensitiveInfo ? 'Authentication required' : message;
}

/**
 * Sanitize authorization errors (403)
 * Only sanitizes when specific role/permission implementation details are exposed
 */
function sanitizeAuthzError(message: string): string {
  const lowerMessage = message.toLowerCase();

  const safeMessages = [
    'access denied',
    'insufficient permissions',
    'forbidden',
    'permission denied'
  ];

  if (safeMessages.includes(lowerMessage)) {
    return message;
  }

  const sensitiveKeywords = ['role', 'admin', 'scope', 'required'];

  const containsSensitiveInfo = sensitiveKeywords.some(keyword =>
    lowerMessage.includes(keyword)
  );

  return containsSensitiveInfo ? 'Access denied' : message;
}

/**
 * Check if error message contains sensitive database information
 */
function sanitizeDatabaseError(message: string): string {
  const lowerMessage = message.toLowerCase();
  const sensitiveKeywords = [
    'column',
    'table',
    'constraint',
    'foreign key',
    'primary key',
    'unique key',
    'database',
    'sql',
    'query',
    'schema'
  ];

  const containsSensitiveInfo = sensitiveKeywords.some(keyword =>
    lowerMessage.includes(keyword)
  );

  return containsSensitiveInfo ? 'Invalid request' : message;
}

/**
 * 5xx status codes that should be sanitized to hide internal details
 * Other 5xx codes can pass through as they're less likely to expose sensitive info
 */
const SANITIZED_5XX_CODES = [500, 502, 504];

/**
 * Sanitize error messages in production to prevent information leakage
 *
 * Prevents leaking:
 * - Internal server details (stack traces, file paths)
 * - Database schema information
 * - Authentication implementation details (JWT, sessions)
 * - Authorization logic specifics (roles, permissions)
 */
function sanitizeErrorMessage(errorResponse: StandardError): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const { statusCode, message } = errorResponse;

  if (SANITIZED_5XX_CODES.includes(statusCode)) {
    errorResponse.message = 'Internal Server Error';
    return;
  }

  const sanitizationRule = SANITIZATION_RULES[statusCode];
  if (sanitizationRule) {
    errorResponse.message = sanitizationRule(message);
  }
}

/**
 * Format error response and send it to client
 * Logs error, creates standardized response, and obscures internal errors in production
 */
export function formatAndSendError(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  const correlationId = request.correlationId;

  logError(request, error, correlationId);
  const statusCode = determineStatusCode(error);
  const errorResponse = createStandardErrorResponse(error, statusCode, correlationId);
  sanitizeErrorMessage(errorResponse);

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
 * Handles both service-specific and generic errors with appropriate logging
 */
export function setupProxyErrorHandler(fastify: FastifyInstance): void {
  fastify.setErrorHandler(
    (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
      if (!reply.sent) {
        const service = findServiceByUrl(request.url);
        handleError(error, request, reply, service);
      }
    }
  );
}

/**
 * Handle errors with optional service context
 * Preserves status codes from upstream services for better observability and debugging
 */
export function handleError(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
  service?: ServiceConfig
): void {
  // Ensure error has a status code (default to 500 if missing)
  const errorWithStatus =
    error instanceof Error && 'statusCode' in error
      ? (error as FastifyError)
      : (Object.assign(error, { statusCode: 500 }) as FastifyError);

  // Add service-specific logging when proxying to upstream services
  if (service) {
    request.log.error(
      {
        error: errorWithStatus.message,
        statusCode: errorWithStatus.statusCode,
        service: service.name,
        upstream: service.upstream,
        url: request.url,
        originalError: errorWithStatus.name
      },
      'Proxy error'
    );
  }

  formatAndSendError(errorWithStatus, request, reply);
}
