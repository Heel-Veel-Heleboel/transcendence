import {
  RateLimitConfig,
  RateLimitEntry
} from '../entity/common';
import fs from 'fs';
import { logger } from '../utils/logger';
import {
  validatePositiveInteger,
  validateTimeWindow,
  parseJsonSafe
} from '../utils/validation';

function getDefaultGlobal(): RateLimitEntry {
  return { max: 1000, timeWindow: '1 minute' };
}

function getDefaultAuthenticated(): RateLimitEntry {
  return { max: 2000, timeWindow: '1 minute' };
}

export function parseJsonRateLimits(
  raw: any,
  defaultEntry: RateLimitEntry,
  context: string
): RateLimitEntry {
  if (!raw || typeof raw !== 'object') {
    logger.info({ context, default: defaultEntry }, 'Using default rate limit');
    return defaultEntry;
  }

  // Validate and parse max
  let max: number;
  if (raw.max !== undefined) {
    max = validatePositiveInteger(raw.max, 'max', context);
  } else {
    max = defaultEntry.max;
    logger.info({ context, max: defaultEntry.max }, 'Using default max');
  }

  // Validate and parse timeWindow
  let timeWindow: string;
  if (raw.timeWindow !== undefined) {
    timeWindow = validateTimeWindow(raw.timeWindow, context);
  } else {
    timeWindow = defaultEntry.timeWindow;
    logger.info({ context, timeWindow: defaultEntry.timeWindow }, 'Using default timeWindow');
  }

  return { max, timeWindow };
}

export function parseJsonEndpointRateLimits(
  raw: any,
  defaultEntry: RateLimitEntry
): { path: string; limit: RateLimitEntry } {
  if (!raw || typeof raw !== 'object') {
    throw new Error('endpoint rate limit entry must be an object');
  }

  const path = String(raw.path || '').trim();
  if (!path) {
    throw new Error('endpoint rate limit entry missing required "path" field');
  }
  const limit = parseJsonRateLimits(raw.limit, defaultEntry, `endpoint "${path}"`);
  return { path, limit };
}

export function parseRateLimitConfig(raw: any): RateLimitConfig {
  const defaultGlobal = getDefaultGlobal();
  const defaultAuthenticated = getDefaultAuthenticated();

  const global = parseJsonRateLimits(raw?.global, defaultGlobal, 'global rate limit');
  const authenticated = parseJsonRateLimits(
    raw?.authenticated,
    defaultAuthenticated,
    'authenticated rate limit'
  );

  // Normalize endpoints into a map for fast lookup: Record<path, RateLimitEntry>
  const endpoints: Record<string, RateLimitEntry> = {};

  // Accept array shape: [{ path, limit: { ... } }, ...]
  if (Array.isArray(raw?.endpoints)) {
    for (const endpoint of raw.endpoints) {
      try {
        const parsed = parseJsonEndpointRateLimits(
          endpoint,
          defaultAuthenticated
        );
        endpoints[parsed.path] = parsed.limit;
      } catch (error: any) {
        logger.warn(
          { error: error.message },
          'Failed to parse endpoint rate limit'
        );
      }
    }
  }

  // Accept object/map shape: { "/path": { max, timeWindow }, ... }
  else if (raw?.endpoints && typeof raw.endpoints === 'object') {
    for (const [path, value] of Object.entries(raw.endpoints)) {
      try {
        const key = String(path).trim();
        if (!key) {
          logger.warn('Skipping endpoint with empty path key');
          continue;
        }
        const limit = parseJsonRateLimits(value, defaultAuthenticated, `endpoint "${key}"`);
        endpoints[key] = limit;
      } catch (error: any) {
        logger.warn(
          { path, error: error.message },
          'Failed to parse endpoint rate limit'
        );
      }
    }
  }

  return { global, authenticated, endpoints };
}

export function getRateLimitConfig(): RateLimitConfig {
  // 1) RATE_LIMITS_FILE env var if set
  const limitsFile = process.env.RATE_LIMITS_FILE;
  if (limitsFile) {
    if (!fs.existsSync(limitsFile)) {
      throw new Error(
        `RATE_LIMITS_FILE is set but file does not exist: ${limitsFile}`
      );
    }
    const raw = fs.readFileSync(limitsFile, 'utf8');
    const parsed = parseJsonSafe(raw, `RATE_LIMITS_FILE(${limitsFile})`);
    return parseRateLimitConfig(parsed);
  }

  // 2) RATE_LIMITS env var
  if (process.env.RATE_LIMITS) {
    const parsed = parseJsonSafe(process.env.RATE_LIMITS, 'RATE_LIMITS env var');
    return parseRateLimitConfig(parsed);
  }

  // 3) none provided -> defaults
  logger.info('No rate limits configured, using defaults');
  return parseRateLimitConfig(undefined);
}
