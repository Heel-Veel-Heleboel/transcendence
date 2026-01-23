import { FastifyReply, FastifyRequest, FastifyError } from 'fastify';
import { AuthenticationError, AuthorizationError, ResourceNotFoundError } from '../error/auth.js';


function isValidationError(error: unknown): error is { validation: unknown } {
  return typeof error === 'object' && error !== null && 'validation' in error;
}

export function authErrorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
): FastifyReply {
  request.log.error({ err: error }, 'Authentication/Authorization error occurred');

  if (error instanceof AuthenticationError) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: error.message
    });
  }

  if (error instanceof AuthorizationError) {
    return reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: error.message
    });
  }

  if (error instanceof ResourceNotFoundError) {
    return reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: error.message
    });
  }

  if (isValidationError(error)) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      details: error.validation
    });
  }

  return reply.status(500).send({
    statusCode: 500,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message
  });
}