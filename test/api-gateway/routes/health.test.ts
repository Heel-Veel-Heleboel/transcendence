import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FastifyInstance } from 'fastify';

let fetchSpy: ReturnType<typeof vi.spyOn>;

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

async function createAppWithLogCapture(logLevel: 'warn' | 'error' = 'error') {
  const logs: Record<string, any>[] = [];
  const { default: Fastify } = await import('fastify');
  const testApp = Fastify({
    logger: {
      level: logLevel,
      stream: {
        write: (msg: string) => {
          logs.push(JSON.parse(msg));
        }
      }
    }
  });

  const { healthRoutes } = await import('../../../src/api-gateway/src/routes/health');
  await testApp.register(healthRoutes);
  await testApp.ready();

  return { testApp, logs };
}

async function getHealthDetailed(app: FastifyInstance) {
  const response = await app.inject({
    method: 'GET',
    url: '/health/detailed'
  });
  return { response, body: response.json() };
}

describe('Health Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    const { default: Fastify } = await import('fastify');
    app = Fastify({
      logger: {
        level: 'warn' 
      }
    });

    const { healthRoutes } = await import('../../../src/api-gateway/src/routes/health');
    await app.register(healthRoutes);
    await app.ready();

    fetchSpy = vi.spyOn(globalThis as any, 'fetch').mockResolvedValue({ status: 200 });
  });

  afterEach(async () => {
    if (app) await app.close();
    fetchSpy?.mockRestore();
    vi.restoreAllMocks();
  });

  describe('GET /health', () => {
    it('should return healthy status with correct structure', async () => {
      const response = await app.inject({ method: 'GET', url: '/health' });
      const body = response.json();

      expect(response.statusCode).toBe(200);
      expect(body).toMatchObject({
        status: 'healthy',
        service: 'api-gateway',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        version: expect.any(String)
      });

      // Verify timestamp is valid ISO format
      expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
      expect(body.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /health/detailed', () => {
    it('should return healthy status when all services are healthy', async () => {
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
      
      body.services.forEach((service: any) => {
        expect(service).toHaveProperty('service');
        expect(service).toHaveProperty('status');
        expect(service).toHaveProperty('timestamp');
        expect(service).toHaveProperty('responseTime');
        expect(service.status).toBe('healthy');
      });
    });

    it('should return degraded status when some services are unhealthy', async () => {
      // First service (user-service) returns healthy on first attempt
      // Second service (game-service) fails, then retries and fails again (2 attempts total)
      fetchSpy
        .mockResolvedValueOnce({ status: 200 }) // user-service success
        .mockRejectedValueOnce(new Error('Connection refused')) // game-service attempt 1
        .mockRejectedValueOnce(new Error('Connection refused')); // game-service attempt 2 (retry)

      const response = await app.inject({
        method: 'GET',
        url: '/health/detailed'
      });

      expect(response.statusCode).toBe(200);

      const body = response.json();
      expect(body.status).toBe('degraded');
      expect(body.services).toHaveLength(2);

      expect(body.services[0].status).toBe('healthy');
      expect(body.services[0].service).toBe('user-service');

      expect(body.services[1].status).toBe('unhealthy');
      expect(body.services[1].service).toBe('game-service');
      expect(body.services[1]).toHaveProperty('error');
    });

    it('should log warning when returning degraded status', async () => {
      const { testApp, logs } = await createAppWithLogCapture('warn');

      // First service (user-service) returns healthy on first attempt
      // Second service (game-service) fails, then retries and fails again (2 attempts total)
      fetchSpy
        .mockResolvedValueOnce({ status: 200 }) // user-service success
        .mockRejectedValueOnce(new Error('Connection refused')) // game-service attempt 1
        .mockRejectedValueOnce(new Error('Connection refused')); // game-service attempt 2 (retry)

      await getHealthDetailed(testApp);

      const warnLog = logs.find(log => log.msg === 'Health check returned degraded status');
      expect(warnLog).toBeDefined();
      if (warnLog) {
        expect(warnLog.unhealthyServices).toBeDefined();
        expect(warnLog.unhealthyServices.some((s: any) => s.service === 'game-service')).toBe(true);
      }

      await testApp.close();
    });

    it('should log errors for failed service health checks', async () => {
      const { testApp, logs } = await createAppWithLogCapture('error');

      fetchSpy.mockRejectedValue(new Error('Connection refused'));

      await getHealthDetailed(testApp);

      const errorLogs = logs.filter(log => log.msg === 'Health check attempt failed');
      expect(errorLogs.length).toBeGreaterThan(0);

      const firstError = errorLogs[0];
      expect(firstError).toMatchObject({
        service: expect.any(String),
        attempt: expect.any(Number),
        error: expect.any(String),
        responseTime: expect.any(Number),
        errorDetails: expect.any(Object)
      });

      await testApp.close();
    });

    it.each([
      {
        name: 'timeout errors',
        mockValue: new Error('timeout'),
        rejected: true,
        expectedStatus: 'degraded',
        expectedServiceStatus: 'unhealthy',
        errorCheck: (error: string) => expect(error).toContain('timeout')
      },
      {
        name: '4xx responses as healthy',
        mockValue: { status: 404 },
        rejected: false,
        expectedStatus: 'healthy',
        expectedServiceStatus: 'healthy'
      },
      {
        name: '5xx responses as unhealthy',
        mockValue: { status: 500 },
        rejected: false,
        expectedStatus: 'degraded',
        expectedServiceStatus: 'unhealthy'
      },
      {
        name: 'non-Error objects',
        mockValue: 'String error',
        rejected: true,
        expectedStatus: 'degraded',
        expectedServiceStatus: 'unhealthy',
        errorCheck: (error: string) => expect(error).toBe('Service unavailable')
      },
      {
        name: 'null/undefined errors',
        mockValue: null,
        rejected: true,
        expectedStatus: 'degraded',
        expectedServiceStatus: 'unhealthy',
        errorCheck: (error: string) => expect(error).toBe('Service unavailable')
      }
    ])('should handle $name', async ({ mockValue, rejected, expectedStatus, expectedServiceStatus, errorCheck }) => {
      rejected ? fetchSpy.mockRejectedValue(mockValue) : fetchSpy.mockResolvedValue(mockValue);

      const { body } = await getHealthDetailed(app);

      expect(body.status).toBe(expectedStatus);
      body.services.forEach((service: any) => {
        expect(service.status).toBe(expectedServiceStatus);
        if (errorCheck && service.error) {
          errorCheck(service.error);
        }
      });
    });

    it('should measure response time correctly', async () => {
      const delay = 100;
      fetchSpy.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ status: 200 }), delay))
      );

      const { body } = await getHealthDetailed(app);

      body.services.forEach((service: any) => {
        expect(service.responseTime).toBeGreaterThanOrEqual(delay - 10);
        expect(service.responseTime).toBeLessThan(delay + 50);
      });
    });

    it('should use fetch with AbortController signal', async () => {
      await getHealthDetailed(app);

      expect(fetchSpy).toHaveBeenCalledWith(
        'http://user-service:3001/health',
        expect.objectContaining({ signal: expect.any(Object) })
      );
    });

    it('should handle Promise.allSettled rejected entries and log errors', async () => {
      const { testApp, logs } = await createAppWithLogCapture('error');

      // Mock Promise.allSettled to return a rejected entry
      const allSettledSpy = vi.spyOn(Promise, 'allSettled').mockResolvedValueOnce([
        {
          status: 'fulfilled',
          value: {
            service: 'user-service',
            status: 'healthy',
            timestamp: new Date().toISOString(),
            responseTime: 10
          }
        },
        {
          status: 'rejected',
          reason: new Error('Unexpected internal error')
        }
      ] as PromiseSettledResult<any>[]);

      const { body } = await getHealthDetailed(testApp);

      expect(body.status).toBe('degraded');
      expect(body.services).toHaveLength(2);
      expect(body.services[0].status).toBe('healthy');
      expect(body.services[1].status).toBe('unhealthy');
      expect(body.services[1].service).toBe('game-service');
      expect(body.services[1].error).toBe('Unexpected internal error');

      // Verify error was logged
      const errorLog = logs.find(log => log.msg === 'Service health check failed');
      expect(errorLog).toBeDefined();
      expect(errorLog).toMatchObject({
        service: 'game-service',
        error: 'Unexpected internal error'
      });

      allSettledSpy.mockRestore();
      await testApp.close();
    });
  });

  describe('ensureServicesHealthyOrThrow', () => {
    let originalServices: any[];

    beforeEach(async () => {
      // Save original config
      const { config } = await import('../../../src/api-gateway/src/config');
      originalServices = [...config.services];
    });

    afterEach(async () => {
      const { config } = await import('../../../src/api-gateway/src/config');
      (config as any).services = originalServices;
    });

    it('should log and throw when upstreams are unhealthy', async () => {
      const { ensureServicesHealthyOrThrow } = await import('../../../src/api-gateway/src/routes/health');
      const { config } = await import('../../../src/api-gateway/src/config');

      (config as any).services = [{ name: 'svc-timeout', upstream: 'http://svc-timeout' }];

      fetchSpy.mockRejectedValue({ name: 'AbortError' });

      const mockLogger = {
        error: vi.fn()
      };

      await expect(ensureServicesHealthyOrThrow(mockLogger as any)).rejects.toThrow(/One or more upstream services are unhealthy/);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'svc-timeout',
          status: 'unhealthy',
          error: expect.any(String)
        }),
        'Startup health check failed for service'
      );
    });

    it('should not throw when all services are healthy', async () => {
      const { ensureServicesHealthyOrThrow } = await import('../../../src/api-gateway/src/routes/health');

      fetchSpy.mockResolvedValue({ status: 200 });

      const mockLogger = {
        error: vi.fn()
      };

      await expect(ensureServicesHealthyOrThrow(mockLogger as any)).resolves.not.toThrow();

      expect(mockLogger.error).not.toHaveBeenCalled();
    });
  });
});