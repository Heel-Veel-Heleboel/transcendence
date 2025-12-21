import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createServer,
  setupGracefulShutdown,
  start
} from '../../src/api-gateway/src/index';
import * as apiGatewayModule from '../../src/api-gateway/src/index';
import type { FastifyInstance } from 'fastify';

describe('API Gateway', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await createServer();
    await app.ready();
  });

  afterEach(async () => {
    if (app) await app.close();
    vi.restoreAllMocks();
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

  describe('Error Handling', () => {
    it('should log error and exit when server.listen throws', async () => {
      const mockServer = {
        listen: vi.fn().mockRejectedValue(new Error('Failed to start')),
        log: { error: vi.fn(), info: vi.fn() }
      } as any;

      const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {
        throw new Error('exit');
      }) as any);

      await expect(start(mockServer)).rejects.toThrow('exit');
      expect(mockServer.log.error).toHaveBeenCalled();
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('Graceful Shutdown', () => {
    it('should handle SIGTERM and exit gracefully', async () => {
      const mockServer = {
        log: { info: vi.fn() },
        close: vi.fn().mockResolvedValue(undefined)
      } as any;
      const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);

      setupGracefulShutdown(mockServer);

      process.emit('SIGTERM');
      await vi.waitFor(() => {
        expect(mockServer.log.info).toHaveBeenCalledWith(
          'Received SIGTERM, shutting down gracefully'
        );
        expect(mockServer.close).toHaveBeenCalled();
        expect(mockExit).toHaveBeenCalledWith(0);
      });
      mockExit.mockRestore();
    });

    it('should handle SIGINT and exit gracefully', async () => {
      const mockServer = {
        log: { info: vi.fn() },
        close: vi.fn().mockResolvedValue(undefined)
      } as any;
      const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);

      setupGracefulShutdown(mockServer);

      process.emit('SIGINT');
      await vi.waitFor(() => {
        expect(mockServer.log.info).toHaveBeenCalledWith(
          'Received SIGINT, shutting down gracefully'
        );
        expect(mockServer.close).toHaveBeenCalled();
        expect(mockExit).toHaveBeenCalledWith(0);
      });
      mockExit.mockRestore();
    });
  });

  describe('Security Headers (Helmet)', () => {
    it('should include security headers in response', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.statusCode).toBe(200);

      // Check for Helmet security headers
      expect(response.headers).toHaveProperty('x-dns-prefetch-control');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should include HSTS header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.headers).toHaveProperty('strict-transport-security');
      expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
      expect(response.headers['strict-transport-security']).toContain('includeSubDomains');
    });

    it('should include Content-Security-Policy header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.headers).toHaveProperty('content-security-policy');
      const csp = response.headers['content-security-policy'] as string;
      expect(csp).toContain('default-src \'self\'');
    });
  });

  describe('Request Body Size Limits', () => {
    it('should reject requests exceeding body size limit', async () => {
      // Create a payload larger than 1MB (1048576 bytes)
      const largePayload = 'x'.repeat(1048577);

      const response = await app.inject({
        method: 'POST',
        url: '/api/test/something',
        payload: largePayload,
        headers: {
          'content-type': 'text/plain'
        }
      });

      // Should be rejected with 413 Payload Too Large
      expect(response.statusCode).toBe(413);
    });

    it('should accept requests within body size limit', async () => {
      // Create a payload smaller than 1MB
      const smallPayload = { data: 'x'.repeat(1000) };

      const response = await app.inject({
        method: 'POST',
        url: '/api/test/something',
        payload: smallPayload
      });

      // Should not be rejected for size (will fail with different error - no upstream)
      expect(response.statusCode).not.toBe(413);
    });
  });

  describe('Main entry point', () => {
    it('should start the server without errors in production mode', async () => {
      process.env.NODE_ENV = 'production';

      const { createServer, start } = await import(
        '../../src/api-gateway/src/index'
      );

      const server = await start(await createServer());
      expect(server).toBeDefined();
      await server.close();
    });

    it('should not start the server in test mode', async () => {
      process.env.NODE_ENV = 'test';

      const startSpy = vi.spyOn(apiGatewayModule, 'start');

      // Re-import the module to trigger the conditional logic
      await import('../../src/api-gateway/src/index');

      expect(startSpy).not.toHaveBeenCalled();
    });
  });
});
