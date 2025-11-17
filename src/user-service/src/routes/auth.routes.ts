import { FastifyInstance } from 'fastify';
import { registerUserController } from  '../controllers/auth.controller.js';

export default async function authRoutes(fastify: FastifyInstance) {

  fastify.post('/register',  registerUserController);

  // TODO: Implement /login route

}