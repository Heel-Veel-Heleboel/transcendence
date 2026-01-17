import { FastifyReply, FastifyRequest, FastifyError } from 'fastify';
import { AuthenticationError, AuthorizationError, ResourceNotFoundError } from './auth.js';

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

  if ('validation' in error) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      validation: (error as any).validation
    });
  }

  return reply.status(500).send({
    statusCode: 500,
    error: 'Internal Server Error',
    message: 'Internal Server Error'
  });
}