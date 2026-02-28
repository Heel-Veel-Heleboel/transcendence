import { FastifyReply, FastifyRequest, FastifyError } from 'fastify';
import { AuthenticationError, AuthorizationError,  ResourceConflictError, ResourceNotFoundError } from '../error/auth.js';


interface ValidationError {
  instancePath: string;
  message?: string;
  params?: {
    limit?: number;
    [key: string]: unknown;
  };
}

function isFastifyValidationError(
  error: unknown
): error is { validation: ValidationError[] }{
  return (
    typeof error === 'object' && error !== null && 'validation' in error
  );
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

  if (error instanceof ResourceConflictError) {
    return reply.status(409).send({
      statusCode: 409,
      error: 'Conflict',
      message: error.message
    });
  }


  if (isFastifyValidationError(error)) {
    const details = error.validation.map(item => {
      const path = item.instancePath.replace(/^\//, '');
      let message = item.message || '';
      
      if (item.message?.includes('minLength')) {
        message = `${path || 'Field'} must be at least ${item.params?.limit || 3} characters long`;
      } else if (item.message?.includes('maxLength')) {
        message = `${path || 'Field'} must not exceed ${item.params?.limit || 20} characters`;
      } else if (item.message?.includes('pattern')) {
        message = path === 'user_name' 
          ? 'Username can only contain letters, numbers, and underscores'
          : message;
      } else if (item.message?.includes('format') && path === 'email') {
        message = 'Must be a valid email address';
      }
      return { path, message };
    });
    
    return reply.code(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed for the request body',
      details
    });
  }

  return reply.status(500).send({
    statusCode: 500,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message
  });
}