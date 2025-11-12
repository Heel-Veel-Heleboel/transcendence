import { RateLimitConfig } from '../entity/common';

/**
 * Parse rate limiting configuration from environment variables.
 * Supports JSON configuration or individual env vars.
 */
export function getRateLimitConfig(): RateLimitConfig {
  // Method 1: JSON configuration (highest priority)
  if (process.env.RATE_LIMITS) {
    try {
      const rateLimitsJson = JSON.parse(process.env.RATE_LIMITS);
      if (rateLimitsJson && typeof rateLimitsJson === 'object') {
        return {
          global: rateLimitsJson.global || getDefaultGlobal(),
          authenticated:
            rateLimitsJson.authenticated || getDefaultAuthenticated(),
          endpoints: rateLimitsJson.endpoints || getDefaultEndpoints()
        };
      }
    } catch (error) {
      console.warn(
        '[WARNING] Failed to parse RATE_LIMITS JSON, falling back to defaults:',
        error
      );
    }
  }

  // Method 2: Individual environment variables
  const config: RateLimitConfig = {
    global: {
      max: parseInt(process.env.RATE_LIMIT_GLOBAL_MAX || '1000'),
      timeWindow: process.env.RATE_LIMIT_GLOBAL_WINDOW || '1 minute'
    },
    authenticated: {
      max: parseInt(process.env.RATE_LIMIT_AUTHENTICATED_MAX || '2000'),
      timeWindow: process.env.RATE_LIMIT_AUTHENTICATED_WINDOW || '1 minute'
    },
    endpoints: getEndpointRateLimits()
  };

  return config;
}

/**
 * Parse endpoint-specific rate limits from environment variables.
 * Pattern: RATE_LIMIT_ENDPOINT_<ENDPOINT_PATH>_MAX and RATE_LIMIT_ENDPOINT_<ENDPOINT_PATH>_WINDOW
 * Example:
 *   - RATE_LIMIT_ENDPOINT_/api/auth/login_MAX=10
 *   - RATE_LIMIT_ENDPOINT_API_AUTH_LOGIN_MAX=10 (underscores converted to slashes)
 */
function getEndpointRateLimits(): Record<
  string,
  { max: number; timeWindow: string }
  > {
  const endpoints: Record<string, { max: number; timeWindow: string }> = {};

  // Look for endpoint-specific rate limit env vars
  // Pattern: RATE_LIMIT_ENDPOINT_<PATH>_MAX
  for (const [key, value] of Object.entries(process.env)) {
    const maxMatch = key.match(/^RATE_LIMIT_ENDPOINT_(.+)_MAX$/);
    if (maxMatch) {
      // Convert underscores to slashes if path doesn't start with /
      // If it already starts with /, use it as-is
      let endpointPath = maxMatch[1];
      if (!endpointPath.startsWith('/')) {
        endpointPath = '/' + endpointPath.toLowerCase().replace(/_/g, '/');
      }

      const max = parseInt(value || '100');

      // Look for corresponding window config
      const windowKey = `RATE_LIMIT_ENDPOINT_${maxMatch[1]}_WINDOW`;
      const timeWindow = process.env[windowKey] || '1 minute';

      endpoints[endpointPath] = { max, timeWindow };
    }
  }

  // Merge with defaults (env-defined endpoints take precedence)
  const defaultEndpoints = getDefaultEndpoints();
  return { ...defaultEndpoints, ...endpoints };
}

/**
 * Get default global rate limit configuration
 */
function getDefaultGlobal(): { max: number; timeWindow: string } {
  return {
    max: 1000,
    timeWindow: '1 minute'
  };
}

/**
 * Get default authenticated rate limit configuration
 */
function getDefaultAuthenticated(): { max: number; timeWindow: string } {
  return {
    max: 2000,
    timeWindow: '1 minute'
  };
}

/**
 * Get default endpoint-specific rate limit configuration
 */
function getDefaultEndpoints(): Record<
  string,
  { max: number; timeWindow: string }
  > {
  return {
    '/api/auth/login': {
      max: 10,
      timeWindow: '1 minute'
    },
    '/api/games': {
      max: 500,
      timeWindow: '1 minute'
    },
    '/api/users': {
      max: 100,
      timeWindow: '1 minute'
    },
    '/api/chat': {
      max: 200,
      timeWindow: '1 minute'
    }
  };
}
