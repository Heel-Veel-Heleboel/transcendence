/* global fetch, AbortController, setTimeout, clearTimeout */
import { FastifyInstance } from 'fastify';
import { config } from '../config';
import { ServiceHealth } from '../entity/common';

/**
 * Main function to register all health check routes
 */
export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  registerGatewayHealthRoute(fastify);
  registerDetailedHealthRoute(fastify);
}

/**
 * Register simple gateway health check route
 */
function registerGatewayHealthRoute(fastify: FastifyInstance): void {
  fastify.get('/health', async (_request, _reply) => {
    return {
      status: 'healthy',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    };
  });
}

/**
 * Register detailed health check route including all services
 */
function registerDetailedHealthRoute(fastify: FastifyInstance): void {
  fastify.get('/health/detailed', async (_request, _reply) => {
    const services = await checkAllServicesHealth();
    const overallStatus = services.every(s => s.status === 'healthy')
      ? 'healthy'
      : 'degraded';

    return {
      status: overallStatus,
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      services
    };
  });
}

/**
 * Check health of all configured services
 */
async function checkAllServicesHealth(): Promise<ServiceHealth[]> {
  const serviceHealthChecks: PromiseSettledResult<ServiceHealth>[] =
    await Promise.allSettled(
      config.services.map(service =>
        checkServiceHealth(service.name, service.upstream)
      )
    );

  return serviceHealthChecks.map(
    (result: PromiseSettledResult<ServiceHealth>, index: number) => {
      const service = config.services[index];

      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          service: service.name,
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: extractErrorMessage(result.reason)
        };
      }
    }
  );
}

/**
 * Check health of a single service using native fetch with timeout via AbortController
 */
async function checkServiceHealth(
  serviceName: string,
  upstream: string
): Promise<ServiceHealth> {
  const startTime = Date.now();
  const timeoutMs = 3000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${upstream}/health`, {
      signal: controller.signal
    });

    clearTimeout(timeout);
    const responseTime = Date.now() - startTime;
    const isHealthy = response.status < 500; // Accept 4xx as healthy for availability

    return createServiceHealthResponse(serviceName, isHealthy, responseTime);
  } catch (error: unknown) {
    clearTimeout(timeout);
    const responseTime = Date.now() - startTime;
    const errorMessage = extractErrorMessage(error);

    return createServiceHealthResponse(
      serviceName,
      false,
      responseTime,
      errorMessage
    );
  }
}

/**
 * Create service health response
 */
function createServiceHealthResponse(
  serviceName: string,
  isHealthy: boolean,
  responseTime: number,
  error?: string
): ServiceHealth {
  const response: ServiceHealth = {
    service: serviceName,
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    responseTime
  };

  if (error) {
    response.error = error;
  }

  return response;
}

/**
 * Extract error message from unknown error type
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  // Node's AbortController throws a DOMException/AbortError which may not be an Error instance
  if ((error as any)?.name === 'AbortError') return 'timeout';
  return 'Unknown error';
}
