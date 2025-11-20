import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fastify, { FastifyInstance } from 'fastify';
import authRoutes from '../../../src/user-service/src/routes/auth.routes.js';
import prismaPlugin from '../../../src/user-service/src/plugins/prisma-plugin.js';

// Mock the controller
vi.mock('../../../src/user-service/src/controllers/auth.controller.js', () => ({
  registerUserController: vi.fn(async (request, reply) => {
    return reply.code(201).send({
      message: 'User registered successfully.',
      user: {
        id: 1,
        email: 'test@test.com',
        username: 'testuser',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  })
}));

describe('Auth Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();

    app = fastify();
    await app.register(prismaPlugin);
    await app.register(authRoutes, { prefix: '/auth' });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should register a /auth/register route', async () => {
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
    const body = res.json();
    expect(body).toHaveProperty('message', 'User registered successfully.');
    expect(body).toHaveProperty('user');
    expect(body.user).toHaveProperty('id');
    expect(body.user).toHaveProperty('email');
    expect(body.user).toHaveProperty('username');
  });

  it('should accept POST method on /auth/register', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register'
    });

    // Should not be 404 (route exists)
    expect(res.statusCode).not.toBe(404);
  });

  it('should reject GET method on /auth/register', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/auth/register'
    });

    expect(res.statusCode).toBe(404);
  });

  it('should return 404 for unknown routes', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/auth/unknown'
    });

    expect(res.statusCode).toBe(404);
  });
});