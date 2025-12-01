/* global fetch, AbortController, setTimeout, clearTimeout */
import { FastifyInstance, FastifyBaseLogger } from 'fastify';
import { config } from '../config';
import { ServiceHealth } from '../entity/common';

const HEALTH_CHECK_TIMEOUT_MS = 3000;
const HEALTH_CHECK_MAX_ATTEMPTS = 2;
const HEALTH_CHECK_BACKOFF_BASE_MS = 100;

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
  fastify.get('/health/detailed', async (request, _reply) => {
    const services = await checkAllServicesHealth(request.log);
    const overallStatus = services.every(s => s.status === 'healthy')
      ? 'healthy'
      : 'degraded';

    if (overallStatus === 'degraded') {
      const unhealthyServices = services.filter(s => s.status !== 'healthy');
      request.log.warn(
        {
          unhealthyServices: unhealthyServices.map(s => ({
            service: s.service,
            error: s.error
          }))
        },
        'Health check returned degraded status'
      );
    }

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
async function checkAllServicesHealth(logger?: FastifyBaseLogger): Promise<ServiceHealth[]> {
  const serviceHealthChecks: PromiseSettledResult<ServiceHealth>[] =
    await Promise.allSettled(
      config.services.map(service =>
        checkServiceHealth(service.name, service.upstream, HEALTH_CHECK_MAX_ATTEMPTS, logger)
      )
    );

  return serviceHealthChecks.map(
    (result: PromiseSettledResult<ServiceHealth>, index: number) => {
      const service = config.services[index];

      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        const errorMessage = extractErrorMessage(result.reason);

        if (logger) {
          logger.error(
            {
              service: service.name,
              error: errorMessage
            },
            'Service health check failed'
          );
        }

        return {
          service: service.name,
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: errorMessage
        };
      }
    }
  );
}

/**
 * Check health of a single service using native fetch with timeout via AbortController.
 *
 * Features:
 * - Configurable timeout using AbortController (default: 3000ms)
 * - Automatic retry on all errors with exponential backoff (default: 2 attempts)
 * - Exponential backoff: 100ms, 200ms, 400ms, etc.
 * - Accepts 4xx responses as healthy (availability check)
 * - Treats 5xx responses as unhealthy
 *
 * @param serviceName - Name of the service being checked
 * @param upstream - Base URL of the upstream service
 * @param attempts - Maximum number of retry attempts (default: 2)
 * @param logger - Optional Fastify logger for structured logging
 * @returns ServiceHealth object with status and metrics
 */
async function checkServiceHealth(
  serviceName: string,
  upstream: string,
  attempts = HEALTH_CHECK_MAX_ATTEMPTS,
  logger?: FastifyBaseLogger
): Promise<ServiceHealth> {
  const timeoutMs = HEALTH_CHECK_TIMEOUT_MS;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${upstream}/health`, {
        signal: controller.signal
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = response.status < 500; // Accept 4xx as healthy for availability

      return createServiceHealthResponse(serviceName, isHealthy, responseTime);
    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      const errorMessage = extractErrorMessage(error);

      if (logger) {
        logger.error(
          {
            service: serviceName,
            attempt,
            error: errorMessage,
            responseTime,
            errorDetails: error instanceof Error ? {
              name: error.name,
              stack: error.stack
            } : error
          },
          'Health check attempt failed'
        );
      }

      if (attempt < attempts) {
        const backoffMs = HEALTH_CHECK_BACKOFF_BASE_MS * Math.pow(2, attempt - 1);
        await new Promise(res => setTimeout(res, backoffMs));
        continue;
      }

      return createServiceHealthResponse(
        serviceName,
        false,
        responseTime,
        sanitizeErrorMessage(errorMessage)
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  // Fallback - should not be hit
  return createServiceHealthResponse(
    serviceName,
    false,
    0,
    'Service unavailable'
  );
}

/**
 * Sanitize error messages to prevent leaking sensitive information
 */
function sanitizeErrorMessage(errorMessage: string): string {
  const errorMap: Record<string, string> = {
    'timeout': 'Request timeout',
    'network': 'Network error',
    'abort': 'Request aborted',
    'fetch': 'Connection failed'
  };
  
  for (const [key, sanitized] of Object.entries(errorMap)) {
    if (errorMessage.toLowerCase().includes(key)) {
      return sanitized;
    }
  }
  
  return 'Service unavailable';
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
  if ((error as any)?.name === 'AbortError') return 'timeout';
  return 'Unknown error';
}

/**
 * Ensure services are healthy at startup. Call this before fastify.listen().
 * Throws if any required service is unhealthy.
 */
export async function ensureServicesHealthyOrThrow(logger?: FastifyBaseLogger): Promise<void> {
  const services = await checkAllServicesHealth(logger);
  const unhealthy = services.filter(s => s.status !== 'healthy');

  if (unhealthy.length > 0) {
    if (logger) {
      unhealthy.forEach(s =>
        logger.error(
          {
            service: s.service,
            status: s.status,
            error: s.error || 'none'
          },
          'Startup health check failed for service'
        )
      );
    }
    throw new Error('One or more upstream services are unhealthy at startup');
  }
}
