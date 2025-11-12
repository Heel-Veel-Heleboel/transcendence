import { createUser  } from '../services/auth.service.js';
import { validatePassword } from '../utils/password-validator.js';
import { CreateUserData } from '../types/user.js';
import { FastifyRequest, FastifyReply } from 'fastify';

export async function registerUserController(request: FastifyRequest<{Body: CreateUserData}>, reply: FastifyReply) {

  try {
    const { email, username, password } = request.body;

    if (!email || !username || !password) {
      return reply.status(400).send({ error: 'Email, username, and password are required.' });
    }

    const { valid, errors } = validatePassword(password);
    if (!valid) {
      return reply.status(400).send({ error: 'Password does not meet the policy requirements.', details: errors });
    }

    const user = createUser(request.server .prisma, request.body);
    reply.code(201).send(user);

  } catch (error: any) {
    request.log.error(error);

    if (error.code === 'P2002') {
      const target = error.meta?.target?.[0];

      if (target === 'email') {
        return reply.code(409).send({ error: 'Email already in use.' });
      }
      if (target === 'username') {
        return reply.code(409).send({ error: 'Username already taken.' });
      }

      return reply.code(409).send({ error: 'Unique constraint failed.' });
    }

    reply.code(500).send({ error: 'Internal server error.' });

  }
}