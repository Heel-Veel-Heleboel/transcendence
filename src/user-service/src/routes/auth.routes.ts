import { FastifyInstance } from 'fastify';
import { registerUserController } from  '../controllers/auth.controller.js';

export default async function authRoutes(fastify: FastifyInstance) {

  fastify.post('/register',  registerUserController);

  fastify.post('/login', async () => {
    return { message: 'User logged in successfully' };
  });

}