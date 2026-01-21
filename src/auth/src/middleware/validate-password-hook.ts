import { FastifyReply, FastifyRequest } from 'fastify';
import { validatePassword } from '../validators/password.js';
import { PasswordPolicyConfig } from '../config/password.js';
import { RegistrationType, ChangePasswordSchemaType } from '../schemas/auth.js';


export async function validatePasswordHook(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const body = request.body as RegistrationType | ChangePasswordSchemaType;
  //determine if body has 'password' or 'new_password' field
  const password = 'password' in body ? body.password : body.new_password;

  if (!password) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Password is required'
    });
  }

  const validationErrors = validatePassword(password, PasswordPolicyConfig);

  if (!validationErrors.valid) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: validationErrors.messages,
      errors: validationErrors.errors
    });
  }
}