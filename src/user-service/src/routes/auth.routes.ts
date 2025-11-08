import { FastifyInstance } from 'fastify';

export default async function authRoutes(fastify: FastifyInstance) {

  fastify.post('/register', async () => {
    return { message: 'User registered successfully' };
  });

  fastify.post('/login', async () => {
    return { message: 'User logged in successfully' };
  });

}