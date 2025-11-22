import fs from 'fs';
import { z } from 'zod';
import { RateLimitConfig } from '../entity/common';

/**
 * Parse rate limiting configuration from environment variables.
 * Supports JSON configuration or individual env vars.
 */
export function getRateLimitConfig(): RateLimitConfig {
  // 1) File-mounted JSON if RATE_LIMITS_FILE is set
  const limitsFile = process.env.RATE_LIMITS_FILE;
  if (limitsFile) {
    try {
      if (fs.existsSync(limitsFile)) {
        const raw = fs.readFileSync(limitsFile, 'utf8');
        const parsed = JSON.parse(raw);
        const cfg = parseJsonRateLimitsInput(
          parsed,
          `RATE_LIMITS_FILE(${limitsFile})`
        );
        if (cfg) return cfg;
        console.warn(
          `[WARNING] No valid rate limits parsed from ${limitsFile}`
        );
      } else {
        console.warn(
          `[WARNING] RATE_LIMITS_FILE is set but file does not exist: ${limitsFile}`
        );
      }
    } catch (err) {
      console.warn(
        `[WARNING] Failed to read/parse RATE_LIMITS_FILE ${limitsFile}:`,
        err
      );
      // fail-open: continue to next source
    }
  }

  // 2) RATE_LIMITS env var (JSON)
  if (process.env.RATE_LIMITS) {
    try {
      const parsed = JSON.parse(process.env.RATE_LIMITS);
      const cfg = parseJsonRateLimitsInput(parsed, 'RATE_LIMITS env var');
      if (cfg) return cfg;
      console.warn(
        '[WARNING] No valid rate limits parsed from RATE_LIMITS env var'
      );
    } catch (err) {
      // log the error so eslint doesn't complain about unused catch binding
      console.warn(
        '[WARNING] Failed to parse RATE_LIMITS JSON, falling back to env vars:',
        err
      );
    }
  }

  // 3) Individual environment variables fallback (keep existing behavior)
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

// Zod schema for rate limit config (soft validation)
const endpointLimitSchema = z.object({
  max: z.number().int(),
  timeWindow: z.string()
});

const rateLimitSchema = z.object({
  global: endpointLimitSchema.optional(),
  authenticated: endpointLimitSchema.optional(),
  endpoints: z.record(endpointLimitSchema).optional()
});

export function parseJsonRateLimitsInput(
  input: any,
  source: string
): RateLimitConfig | null {
  if (!input || typeof input !== 'object') {
    console.warn(`[WARNING] ${source} must be an object`);
    return null;
  }

  // Safe parse with zod — if it fails, we log but attempt to coerce basic fields
  const parsed = rateLimitSchema.safeParse(input);
  if (parsed.success) {
    const value = parsed.data;
    return {
      global: value.global || getDefaultGlobal(),
      authenticated: value.authenticated || getDefaultAuthenticated(),
      endpoints: value.endpoints || getDefaultEndpoints()
    };
  }

  console.warn(`[WARNING] ${source} failed schema validation:`, parsed.error);

  // Attempt to coerce minimally: pick values if present, otherwise fall back to defaults
  try {
    const global = input.global
      ? {
        max: Number(input.global.max) || getDefaultGlobal().max,
        timeWindow: String(
          input.global.timeWindow || getDefaultGlobal().timeWindow
        )
      }
      : getDefaultGlobal();

    const authenticated = input.authenticated
      ? {
        max: Number(input.authenticated.max) || getDefaultAuthenticated().max,
        timeWindow: String(
          input.authenticated.timeWindow ||
              getDefaultAuthenticated().timeWindow
        )
      }
      : getDefaultAuthenticated();

    const endpointsRaw = input.endpoints || {};
    const endpoints: Record<string, { max: number; timeWindow: string }> = {};
    if (typeof endpointsRaw === 'object') {
      for (const [path, val] of Object.entries(endpointsRaw)) {
        try {
          const max = Number((val as any).max) || 100;
          const timeWindow = String((val as any).timeWindow || '1 minute');
          endpoints[path] = { max, timeWindow };
        } catch (e) {
          console.warn(
            `[WARNING] Skipping invalid endpoint limit for ${path} in ${source}`,
            e
          );
        }
      }
    }

    const mergedEndpoints = { ...getDefaultEndpoints(), ...endpoints };

    return { global, authenticated, endpoints: mergedEndpoints };
  } catch (e) {
    console.warn(
      `[WARNING] Failed to coerce ${source} into RateLimitConfig:`,
      e
    );
    return null;
  }
}