import { ServiceConfig } from '../entity/common';

/**
 * Parse services from environment variables.
 * Supports two formats:
 * 1. JSON array in SERVICES env var: SERVICES='[{"name":"user-service","upstream":"http://...",...}]'
 * 2. Individual service vars: USER_SERVICE_URL, USER_SERVICE_PREFIX, etc.
 */
export function parseServicesFromEnv(): ServiceConfig[] {
  const services: ServiceConfig[] = [];

  if (process.env.SERVICES) {
    try {
      const servicesJson = JSON.parse(process.env.SERVICES);
      if (Array.isArray(servicesJson)) {
        return servicesJson.map((service: any) => ({
          name: service.name || 'unknown-service',
          upstream: service.upstream || service.url || '',
          prefix:
            service.prefix || `/api/${service.name.replace('-service', '')}`,
          rewritePrefix:
            service.rewritePrefix ||
            service.rewrite ||
            service.prefix?.replace('/api/', '') ||
            '',
          timeout:
            service.timeout || parseInt(process.env.DEFAULT_TIMEOUT || '5000'),
          retries:
            service.retries || parseInt(process.env.DEFAULT_RETRIES || '2'),
          requiresAuth: service.requiresAuth ?? service.auth ?? false,
          requiresAuthRoles:
            service.requiresAuthRoles || service.roles || undefined,
          websocket: service.websocket ?? service.ws ?? false,
          websocketPath: service.websocketPath || service.wsPath || undefined
        }));
      }
    } catch (error) {
      console.warn(
        '[WARNING] Failed to parse SERVICES JSON, falling back to individual service vars:',
        error
      );
    }
  }

  // Method 2: Individual service environment variables
  // Pattern: <SERVICE_NAME>_SERVICE_URL=<url>
  // Optional: <SERVICE_NAME>_SERVICE_PREFIX, <SERVICE_NAME>_SERVICE_REWRITE, etc.
  const serviceNames = new Set<string>();

  // Extract service names from env vars matching pattern: <NAME>_SERVICE_URL
  for (const [key] of Object.entries(process.env)) {
    const match = key.match(/^([A-Z_]+)_SERVICE_URL$/);
    if (match) {
      serviceNames.add(match[1].toLowerCase());
    }
  }

  // Build service configs from individual env vars
  for (const serviceName of serviceNames) {
    const upstream = process.env[`${serviceName}_SERVICE_URL`];
    if (!upstream) {
      continue; // Skip if no URL defined
    }

    const prefixEnv = process.env[`${serviceName}_SERVICE_PREFIX`];
    const rewriteEnv = process.env[`${serviceName}_SERVICE_REWRITE`];
    const timeoutEnv = process.env[`${serviceName}_SERVICE_TIMEOUT`];
    const retriesEnv = process.env[`${serviceName}_SERVICE_RETRIES`];
    const requiresAuthEnv = process.env[`${serviceName}_SERVICE_AUTH`];
    const requiresAuthRolesEnv = process.env[`${serviceName}_SERVICE_ROLES`];
    const websocketEnv = process.env[`${serviceName}_SERVICE_WEBSOCKET`];
    const websocketPathEnv =
      process.env[`${serviceName}_SERVICE_WEBSOCKET_PATH`];

    // Default prefix: /api/{service-name-without-service-suffix}
    const defaultPrefix =
      prefixEnv ||
      `/api/${serviceName.replace(/_/g, '-').replace(/-service$/, '')}`;

    // Default rewrite: remove /api prefix
    const defaultRewrite =
      rewriteEnv !== undefined
        ? rewriteEnv
        : defaultPrefix.replace('/api/', '');

    services.push({
      name: serviceName.replace(/_/g, '-'),
      upstream,
      prefix: defaultPrefix,
      rewritePrefix: defaultRewrite,
      timeout: timeoutEnv
        ? parseInt(timeoutEnv)
        : parseInt(process.env.DEFAULT_TIMEOUT || '5000'),
      retries: retriesEnv
        ? parseInt(retriesEnv)
        : parseInt(process.env.DEFAULT_RETRIES || '2'),
      requiresAuth: requiresAuthEnv
        ? requiresAuthEnv.toLowerCase() === 'true'
        : undefined,
      requiresAuthRoles: requiresAuthRolesEnv
        ? requiresAuthRolesEnv.split(',').map(r => r.trim())
        : undefined,
      websocket: websocketEnv
        ? websocketEnv.toLowerCase() === 'true'
        : undefined,
      websocketPath: websocketPathEnv || undefined
    });
  }

  return services;
}

/**
 * Get default services (fallback when no env vars are set)
 */
export function getDefaultServices(): ServiceConfig[] {
  return [
    {
      name: 'user-service',
      upstream: 'http://user-service:3001',
      prefix: '/api/users',
      rewritePrefix: '/users',
      timeout: 5000,
      retries: 3
    },
    {
      name: 'game-service',
      upstream: 'http://game-service:3002',
      prefix: '/api/games',
      rewritePrefix: '/games',
      timeout: 10000,
      retries: 2
    },
    {
      name: 'matchmaking-service',
      upstream: 'http://matchmaking-service:3003',
      prefix: '/api/matchmaking',
      rewritePrefix: '/matchmaking',
      timeout: 5000,
      retries: 3
    },
    {
      name: 'chat-service',
      upstream: 'http://chat-service:3004',
      prefix: '/api/chat',
      rewritePrefix: '/chat',
      timeout: 3000,
      retries: 2
    },
    {
      name: 'tournament-service',
      upstream: 'http://tournament-service:3005',
      prefix: '/api/tournaments',
      rewritePrefix: '/tournaments',
      timeout: 5000,
      retries: 3
    },
    {
      name: 'localization-service',
      upstream: 'http://localization-service:3006',
      prefix: '/api/localization',
      rewritePrefix: '/localization',
      timeout: 2000,
      retries: 1
    }
  ];
}

/**
 * Merge environment-defined services with defaults.
 * Env services take priority, defaults fill in gaps.
 */
export function getServicesConfig(): ServiceConfig[] {
  const envServices = parseServicesFromEnv();

  // If services are defined in env, use them
  if (envServices.length > 0) {
    return envServices;
  }

  // Otherwise, fall back to defaults
  return getDefaultServices();
}
