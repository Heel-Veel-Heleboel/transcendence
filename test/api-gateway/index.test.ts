import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer } from '../../src/api-gateway/src/index';
import type { FastifyInstance } from 'fastify';

describe('API Gateway', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    // Use your actual server creation function
    app = createServer();
    await app.ready();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.statusCode).toBe(200);

      const body = response.json();
      expect(body).toMatchObject({
        status: 'healthy'
      });
      expect(body).toHaveProperty('timestamp');
      expect(typeof body.timestamp).toBe('string');
    });
  });

  describe('Route Registration', () => {
    it('should register health route', () => {
      const routes = app.printRoutes();
      expect(routes).toContain('health');
    });

    it('should register proxy route', () => {
      const routes = app.printRoutes();
      expect(routes).toContain('api/test');
    });

    it('should have both routes registered', () => {
      const routes = app.printRoutes();
      expect(routes).toContain('health (GET, HEAD)');
      expect(routes).toContain('api/test');
    });
  });
});
