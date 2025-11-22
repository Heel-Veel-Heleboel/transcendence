import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fastify, { FastifyInstance } from 'fastify';
import authRoutes from '../../../src/user-service/src/routes/auth.routes.js';
import prismaPlugin from '../../../src/user-service/src/plugins/prisma-plugin.js';


vi.mock('../../../src/user-service/src/controllers/auth.controller.js', () => ({
  registerUserController: vi.fn(async (request, reply) => {
    return reply.code(201).send({
      message: 'User registered successfully.',
      user: { id: 1, email: 'test@test.com', username: 'testuser' }
    });
  }),
  loginUserController: vi.fn(async (request, reply) => {
    return reply.code(200).send({
      message: 'Login successful!',
      token: 'fake-jwt-token'
    });
  })
}));

describe('Auth Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    app = fastify({ logger: false });
    await app.register(prismaPlugin);
    await app.register(authRoutes, { prefix: '/auth' });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should have a register route', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'test@test.com',
          username: 'testuser',
          password: 'Password@123'
        }
      });

      expect(res.statusCode).toBe(201);
      expect(res.json()).toEqual({
        message: 'User registered successfully.',
        user: { id: 1, email: 'test@test.com', username: 'testuser' }
      });
    });

    it('should reject GET method', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/auth/register'
      });

      expect(res.statusCode).toBe(404); // Route not found for GET
    });
  });

  describe('POST /auth/login', () => {
    it('should have a login route', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'test@test.com',
          password: 'password123'
        }
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({
        message: 'Login successful!',
        token: 'fake-jwt-token'
      });
    });

    it('should reject GET method', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/auth/login'
      });

      expect(res.statusCode).toBe(404); // Route not found for GET
    });
  });

  describe('Route registration', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/unknown'
      });

      expect(res.statusCode).toBe(404);
    });

    it('should accept POST on /auth/register', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/register'
      });

      // Should NOT be 404 (route exists)
      expect(res.statusCode).not.toBe(404);
    });

    it('should accept POST on /auth/login', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/login'
      });

      // Should NOT be 404 (route exists)
      expect(res.statusCode).not.toBe(404);
    });
  });
});