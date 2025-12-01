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

const DEFAULT_GLOBAL_RATE_LIMIT: RateLimitEntry = { max: 1000, timeWindow: '1 minute' };
const DEFAULT_AUTHENTICATED_RATE_LIMIT: RateLimitEntry = { max: 2000, timeWindow: '1 minute' };

export function parseJsonRateLimits(
  raw: any,
  defaultEntry: RateLimitEntry,
  context: string
): RateLimitEntry {
  if (!raw || typeof raw !== 'object') {
    logger.info({ context, default: defaultEntry }, 'Using default rate limit');
    return defaultEntry;
  }

  let max: number;
  if (raw.max !== undefined) {
    max = validatePositiveInteger(raw.max, 'max', context);
  } else {
    max = defaultEntry.max;
    logger.info({ context, max: defaultEntry.max }, 'Using default max');
  }

  let timeWindow: string;
  if (raw.timeWindow !== undefined) {
    timeWindow = validateTimeWindow(raw.timeWindow, context);
  } else {
    timeWindow = defaultEntry.timeWindow;
    logger.info({ context, timeWindow: defaultEntry.timeWindow }, 'Using default timeWindow');
  }

  return { max, timeWindow };
}

export function parseRateLimitConfig(raw: any): RateLimitConfig {
  const global = parseJsonRateLimits(raw?.global, DEFAULT_GLOBAL_RATE_LIMIT, 'global rate limit');
  const authenticated = parseJsonRateLimits(
    raw?.authenticated,
    DEFAULT_AUTHENTICATED_RATE_LIMIT,
    'authenticated rate limit'
  );

  const endpoints: Record<string, RateLimitEntry> = {};

  if (raw?.endpoints && typeof raw.endpoints === 'object' && !Array.isArray(raw.endpoints)) {
    for (const [path, value] of Object.entries(raw.endpoints)) {
      try {
        const key = String(path).trim();
        if (!key) {
          logger.warn('Skipping endpoint with empty path key');
          continue;
        }
        const limit = parseJsonRateLimits(value, DEFAULT_AUTHENTICATED_RATE_LIMIT, `endpoint "${key}"`);
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

  if (process.env.RATE_LIMITS) {
    const parsed = parseJsonSafe(process.env.RATE_LIMITS, 'RATE_LIMITS env var');
    return parseRateLimitConfig(parsed);
  }

  logger.info('No rate limits configured, using defaults');
  return parseRateLimitConfig(undefined);
}
