import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import authRoutes from '../../../src/user-service/src/routes/auth.routes.js';
import fastify from 'fastify';



describe('Auth Routes', () => {
  let app: ReturnType<typeof fastify>;
  beforeEach(async () => {
    app = fastify();
    await app.register(authRoutes, { prefix: '/auth' });
    await app.ready();
  });

  afterEach(async () => {
    await fastify().close();
  });

  it('should register a /auth/register route', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register'
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload)).toEqual({ message: 'User registered successfully' });
  });

  it('should register a /auth/login route', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login'
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ message: 'User logged in successfully' });
  });

  it('should return 404 for unknown routes', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/auth/unknown'
    });
    expect(res.statusCode).toBe(404);
  });
});
