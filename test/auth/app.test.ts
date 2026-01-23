
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';


describe('Auth Integration Tests', () => {
  let app: any;

  beforeAll(async () => {
    // Run migrations on the in-memory database using the correct schema path
    execSync('npx prisma migrate deploy && npx prisma generate', {
      cwd: 'src/auth',
      env: { ...process.env }
    });

    // Import the app after migrations so Prisma picks up the DATABASE_URL
    app = (await import('../../src/auth/src/app.js')).default;
    await app.ready();
  });

  afterAll(async () => {
    if (app && typeof app.close === 'function') {
      await app.close(); // Clean up
    }
  });

  it('should register a new user', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/register',
      payload: {
        user_name: 'testuser',
        email: 'test@example.com',
        password: 'ValidPass123!'
      }
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toHaveProperty('user_id');
  });

});