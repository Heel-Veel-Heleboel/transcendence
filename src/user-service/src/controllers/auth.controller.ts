import { createUser } from '../services/auth.service.js';
import { validatePassword } from '../utils/password-validator.js';
import { CreateUserData } from '../types/user.js';
import { FastifyRequest, FastifyReply } from 'fastify';
import { DuplicateEntryError, DatabaseError } from '../error/prisma-error.js';

export async function registerUserController(request: FastifyRequest<{ Body: CreateUserData }>, reply: FastifyReply) {
  try {
    const { email, username, password } = request.body;


    if (!email) {
      return reply.status(400).send({
        error: 'Email is required.'
      });
    }
    if (!username) {
      return reply.status(400).send({
        error: 'Username is required.'
      });
    }
    if (!password) {
      return reply.status(400).send({
        error: 'Password is required.'
      });
    }

    const { valid, errors } = validatePassword(password);

    if (!valid) {
      return reply.status(400).send({
        error: 'Password does not meet the policy requirements.',
        details: errors
      });
    }

    const user = await createUser(request.server.prisma, request.body);

    return reply.code(201).send({
      message: 'User registered successfully.',
      user: user
    });

  } catch (error: unknown) {

    // Handle duplicate email/username (409 Conflict)
    if (error instanceof DuplicateEntryError) {
      return reply.status(409).send({
        error: error.message,
        field: error.field
      });
    }

    // Handle database errors (500 Internal Server Error)
    if (error instanceof DatabaseError) {

      request.log.error(error);

      return reply.status(500).send({
        error: 'Failed to create user. Please try again later.'
      });
    }

    // Unexpected errors (should rarely happen)
    request.log.error(error instanceof Error ? error : { error }, 'Unexpected error');
    return reply.status(500).send({
      error: 'An unexpected error occurred.'
    });
  }
}