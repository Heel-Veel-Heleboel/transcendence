import { FastifyInstance } from 'fastify';
import axios from 'axios';
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
  const serviceHealthChecks = await Promise.allSettled(
    config.services.map(service =>
      checkServiceHealth(service.name, service.upstream)
    )
  );

  return serviceHealthChecks.map((result, index) => {
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
  });
}

/**
 * Check health of a single service
 */
async function checkServiceHealth(
  serviceName: string,
  upstream: string
): Promise<ServiceHealth> {
  const startTime = Date.now();

  try {
    const response = await axios.get(`${upstream}/health`, {
      timeout: 3000,
      validateStatus: status => status < 500 // Accept 4xx as healthy
    });

    const responseTime = Date.now() - startTime;
    const isHealthy = response.status < 400;

    return createServiceHealthResponse(serviceName, isHealthy, responseTime);
  } catch (error: unknown) {
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
  return error instanceof Error ? error.message : 'Unknown error';
}
