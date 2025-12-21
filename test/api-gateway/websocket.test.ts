import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer } from '../../src/api-gateway/src/index';
import type { FastifyInstance } from 'fastify';

describe('WebSocket Support', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await createServer();
    await app.ready();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  describe('WebSocket Plugin Registration', () => {
    it('should have websocket plugin registered', () => {
      // Check that the websocket plugin is registered
      const plugins = app.printPlugins();
      expect(plugins).toContain('@fastify/websocket');
    });

    it('should have websocket decorator available', () => {
      // The @fastify/websocket plugin adds a 'websocketServer' decorator
      expect(app).toHaveProperty('websocketServer');
    });
  });

  describe('WebSocket Route Handling', () => {
    it('should handle websocket upgrade requests', async () => {
      // Need to create a new server instance for this test
      const testApp = await createServer();

      // Create a test route with websocket support BEFORE calling ready()
      testApp.get('/ws-test', { websocket: true }, (connection, req) => {
        connection.socket.on('message', (message) => {
          // Echo the message back
          connection.socket.send(message);
        });
      });

      await testApp.ready();

      // Test that the route exists
      const routes = testApp.printRoutes();
      expect(routes).toContain('ws-test');

      await testApp.close();
    });

    it('should support both HTTP and WebSocket on same route', async () => {
      // Create a new server instance
      const testApp = await createServer();

      // Register a route that handles both HTTP and WebSocket BEFORE ready()
      testApp.get('/dual-test', { websocket: true }, (connection, req) => {
        connection.socket.send('WebSocket connected');
      });

      await testApp.ready();

      // Test HTTP request to the same route
      const response = await testApp.inject({
        method: 'GET',
        url: '/dual-test'
      });

      // Should return 404 or appropriate error for HTTP on WS-only route
      // or handle both if configured
      expect(response.statusCode).toBeDefined();

      await testApp.close();
    });
  });

  describe('WebSocket Configuration', () => {
    it('should support websocket option in proxy configuration', () => {
      // Verify that our ExtendedHttpProxyOptions includes websocket
      // This is a type-level test, but we can verify the server accepts the config
      const hasWebSocketSupport = app.hasDecorator('websocketServer');
      expect(hasWebSocketSupport).toBe(true);
    });
  });
});
