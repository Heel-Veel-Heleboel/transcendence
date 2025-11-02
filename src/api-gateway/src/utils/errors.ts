import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';

export interface StandardError {
  statusCode: number;
  error: string;
  message: string;
  correlationId?: string;
  timestamp: string;
}

// Global error handler
export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  const correlationId = (request as any).correlationId;
  
  // Log the error
  request.log.error({
    error: error.message,
    stack: error.stack,
    correlationId,
    url: request.url,
    method: request.method
  }, 'Request error');

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


