import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { app } from '../../src/user-service/src/app.js';

describe('Auth Routes', () => {

  beforeAll(async () => {
    await app.ready(); // make sure routes are registered
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register /auth/register', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register'
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ message: 'User registered successfully' });
  });

  it('should register /auth/login', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login'
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ message: 'User logged in successfully' });
  });
});