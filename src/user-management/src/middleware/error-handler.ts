import { FastifyError, FastifyReply, FastifyRequest, FastifyInstance } from 'fastify';
import  * as UserErrors from '../error/user.js';
import { UserDomainErrorMessages, CommonErrorMessages } from '../constants/error-messages.js';

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

export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
): FastifyReply | Promise<FastifyReply>
{
  request.log.error({ error: error }, 'User-management error occurred');


  if (error instanceof UserErrors.UserAlreadyExistsError) {
    return reply.code(409).send({
      statusCode: 409,
      error: 'Conflict',
      message: error.unique_field === 'email' ? UserDomainErrorMessages.EMAIL_ALREADY_EXISTS : UserDomainErrorMessages.NAME_ALREADY_EXISTS
    });
  }

  if (error instanceof UserErrors.UserNotFoundError) {
    return reply.code(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: UserDomainErrorMessages.USER_NOT_FOUND
    });
  }

  if (error instanceof UserErrors.DatabaseError) {
    return reply.code(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: CommonErrorMessages.DATABASE_ERROR
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
      } else if (item.message?.includes('format') && path === 'user_email') {
        message = 'Must be a valid email address';
      }
      return { path, message };
    });
    
    return reply.code(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: CommonErrorMessages.VALIDATION_ERROR,
      details
    });
  }

  return reply.code(500).send({
    statusCode: 500,
    error: 'Internal Server Error',
    message: CommonErrorMessages.INTERNAL_SERVER_ERROR
  });
}