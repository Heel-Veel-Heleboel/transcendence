import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FastifyInstance } from 'fastify';

let fetchSpy: any;

// Mock config (use the same module path the route imports)
vi.mock('../../../src/api-gateway/src/config', () => ({
  config: {
    services: [
      {
        name: 'user-service',
        upstream: 'http://user-service:3001',
        prefix: '/api/users'
      },
      {
        name: 'game-service', 
        upstream: 'http://game-service:3002',
        prefix: '/api/games'
      }
    ]
  }
}));

describe('Health Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    const { default: Fastify } = await import('fastify');
    app = Fastify({ logger: false });

    // Dynamically import routes after mocks are in place
    const { healthRoutes } = await import('../../../src/api-gateway/src/routes/health');
    await app.register(healthRoutes);
    await app.ready();
    
    // Setup global fetch spy with a default successful response
    fetchSpy = vi.spyOn(globalThis as any, 'fetch').mockResolvedValue({ status: 200 });
  });

  afterEach(async () => {
    if (app) await app.close();
    // restore fetch spy and all mocks
    fetchSpy?.mockRestore();
    vi.restoreAllMocks();
  });

  describe('GET /health', () => {
    it('should return healthy status with correct structure', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.statusCode).toBe(200);
      
      const body = response.json();
      expect(body).toMatchObject({
        status: 'healthy',
        service: 'api-gateway'
      });
      
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('uptime');
      expect(body).toHaveProperty('version');
      expect(typeof body.timestamp).toBe('string');
      expect(typeof body.uptime).toBe('number');
    });

    it('should return valid ISO timestamp', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      const body = response.json();
      const timestamp = new Date(body.timestamp);
      expect(timestamp.toISOString()).toBe(body.timestamp);
    });

    it('should return process uptime', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      const body = response.json();
      expect(body.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /health/detailed', () => {
    it('should return healthy status when all services are healthy', async () => {
      // Mock successful fetch calls
      fetchSpy.mockResolvedValue({ status: 200 });

      const response = await app.inject({
        method: 'GET',
        url: '/health/detailed'
      });

      expect(response.statusCode).toBe(200);
      
      const body = response.json();
      expect(body.status).toBe('healthy');
      expect(body.service).toBe('api-gateway');
      expect(body.services).toHaveLength(2);
      
      // Check service health structure
      body.services.forEach((service: any) => {
        expect(service).toHaveProperty('service');
        expect(service).toHaveProperty('status');
        expect(service).toHaveProperty('timestamp');
        expect(service).toHaveProperty('responseTime');
        expect(service.status).toBe('healthy');
      });
    });

    it('should return degraded status when some services are unhealthy', async () => {
      // Mock mixed responses
      fetchSpy
        .mockResolvedValueOnce({ status: 200 })
        .mockRejectedValueOnce(new Error('Connection refused'));

      const response = await app.inject({
        method: 'GET',
        url: '/health/detailed'
      });

      expect(response.statusCode).toBe(200);
      
      const body = response.json();
      expect(body.status).toBe('degraded');
      expect(body.services).toHaveLength(2);
      
      // First service should be healthy
      expect(body.services[0].status).toBe('healthy');
      expect(body.services[0].service).toBe('user-service');
      
      // Second service should be unhealthy
      expect(body.services[1].status).toBe('unhealthy');
      expect(body.services[1].service).toBe('game-service');
      expect(body.services[1]).toHaveProperty('error');
    });

    it('should handle service timeout errors', async () => {
      fetchSpy.mockRejectedValue(new Error('timeout'));

      const response = await app.inject({
        method: 'GET',
        url: '/health/detailed'
      });

      const body = response.json();
      expect(body.status).toBe('degraded');
      body.services.forEach((service: any) => {
        expect(service.status).toBe('unhealthy');
        expect(service.error).toContain('timeout');
      });
    });

    it('should handle 4xx responses as healthy', async () => {
      fetchSpy.mockResolvedValue({ status: 404 });

      const response = await app.inject({
        method: 'GET',
        url: '/health/detailed'
      });

      const body = response.json();
      expect(body.status).toBe('healthy');
      body.services.forEach((service: any) => {
        expect(service.status).toBe('healthy');
      });
    });

    it('should handle 5xx responses as unhealthy', async () => {
      fetchSpy.mockResolvedValue({ status: 500 });

      const response = await app.inject({
        method: 'GET',
        url: '/health/detailed'
      });

      const body = response.json();
      expect(body.status).toBe('degraded');
      body.services.forEach((service: any) => {
        expect(service.status).toBe('unhealthy');
      });
    });

    it('should measure response time correctly', async () => {
      const delay = 100;
      fetchSpy.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ status: 200 }), delay)
        )
      );

      const response = await app.inject({
        method: 'GET',
        url: '/health/detailed'
      });

      const body = response.json();
      body.services.forEach((service: any) => {
        expect(service.responseTime).toBeGreaterThanOrEqual(delay - 10);
        expect(service.responseTime).toBeLessThan(delay + 50);
      });
    });

    it('should handle fetch configuration correctly', async () => {
      fetchSpy.mockResolvedValue({ status: 200 });

      await app.inject({
        method: 'GET',
        url: '/health/detailed'
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        'http://user-service:3001/health',
        expect.objectContaining({ signal: expect.any(Object) })
      );

    });

    it('should handle non-Error objects in catch blocks', async () => {
      fetchSpy.mockRejectedValue('String error');

      const response = await app.inject({
        method: 'GET',
        url: '/health/detailed'
      });

      const body = response.json();
      expect(body.status).toBe('degraded');
      body.services.forEach((service: any) => {
        expect(service.status).toBe('unhealthy');
        expect(service.error).toBe('Unknown error');
      });
    });

    it('should handle null/undefined errors', async () => {
      fetchSpy.mockRejectedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/health/detailed'
      });

      const body = response.json();
      body.services.forEach((service: any) => {
        expect(service.error).toBe('Unknown error');
      });
    });

    it('should handle rejected entries from Promise.allSettled as unhealthy services', async () => {
      const fulfilledVal = {
        service: 'user-service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        responseTime: 10
      };
      const rejectedReason = new Error('simulated failure');

      const allSettledMock = vi
        .spyOn(Promise, 'allSettled')
        .mockImplementationOnce(() =>
          Promise.resolve([
            { status: 'fulfilled', value: fulfilledVal },
            { status: 'rejected', reason: rejectedReason }
          ] as unknown as Array<PromiseSettledResult<any>>)
        );

      const response = await app.inject({ method: 'GET', url: '/health/detailed' });
      expect(response.statusCode).toBe(200);

      const body = response.json();
      expect(body.services).toHaveLength(2);
      expect(body.services[0].service).toBe('user-service');
      expect(body.services[0].status).toBe('healthy');

      expect(body.services[1].service).toBe('game-service');
      expect(body.services[1].status).toBe('unhealthy');
      expect(body.services[1].error).toContain('simulated failure');

      allSettledMock.mockRestore();
    });

    it('should work with actual HTTP services (mocked via fetch)', async () => {
      // Reconfigure module to point to a single test service
      vi.resetModules();
      vi.doMock('../../../src/api-gateway/src/config', () => ({
        config: {
          services: [{
            name: 'test-service',
            upstream: 'http://localhost:9999',
            prefix: '/api/test'
          }]
        }
      }));

      // Ensure fetch resolves successfully for this test
      fetchSpy.mockResolvedValue({ status: 200 });

      // Re-register routes with new config
      const { default: Fastify } = await import('fastify');
      const testApp = Fastify({ logger: false });
      
      // Import fresh module with mocked config
      const { healthRoutes: freshHealthRoutes } = await import('../../../src/api-gateway/src/routes/health');
      await testApp.register(freshHealthRoutes);
      await testApp.ready();

      const response = await testApp.inject({
        method: 'GET',
        url: '/health/detailed'
      });

      const body = response.json();
      expect(body.status).toBe('healthy');
      expect(body.services[0].status).toBe('healthy');
      expect(body.services[0].service).toBe('test-service');

      await testApp.close();
    });
  });

  it('ensureServicesHealthyOrThrow logs and throws when upstreams are unhealthy', async () => {
    const { ensureServicesHealthyOrThrow } = await import('../../../src/api-gateway/src/routes/health');
    const { config } = await import('../../../src/api-gateway/src/config');

    (config as any).services = [{ name: 'svc-timeout', upstream: 'http://svc-timeout' }];

    fetchSpy.mockRejectedValue({ name: 'AbortError' });

    const errors: string[] = [];
    const origConsoleError = console.error;
    console.error = (msg?: any) => {
      errors.push(String(msg));
      return undefined as any;
    };

    await expect(ensureServicesHealthyOrThrow()).rejects.toThrow(/One or more upstream services are unhealthy/);

    expect(errors.some(e => e.includes('svc-timeout'))).toBe(true);

    console.error = origConsoleError;
  });
});