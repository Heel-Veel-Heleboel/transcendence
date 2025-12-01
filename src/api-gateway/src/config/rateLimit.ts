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

function parseMax(raw: Record<string, unknown>, defaultMax: number, context: string): number {
  if (raw.max === undefined) {
    logger.info({ context, max: defaultMax }, 'Using default max');
    return defaultMax;
  }
  return validatePositiveInteger(raw.max, 'max', context);
}

function parseTimeWindow(raw: Record<string, unknown>, defaultTimeWindow: string, context: string): string {
  if (raw.timeWindow === undefined) {
    logger.info({ context, timeWindow: defaultTimeWindow }, 'Using default timeWindow');
    return defaultTimeWindow;
  }
  return validateTimeWindow(raw.timeWindow as string, context);
}

export function parseJsonRateLimits(
  raw: Record<string, unknown> | null | undefined,
  defaultEntry: RateLimitEntry,
  context: string
): RateLimitEntry {
  if (!raw || typeof raw !== 'object') {
    logger.info({ context, default: defaultEntry }, 'Using default rate limit');
    return defaultEntry;
  }

  const max = parseMax(raw, defaultEntry.max, context);
  const timeWindow = parseTimeWindow(raw, defaultEntry.timeWindow, context);

  return { max, timeWindow };
}

function normalizeEndpointValue(value: unknown): Record<string, unknown> | null {
  return (value && typeof value === 'object' && !Array.isArray(value))
    ? (value as Record<string, unknown>)
    : null;
}

function parseEndpointEntry(path: string, value: unknown): RateLimitEntry | null {
  const key = String(path).trim();
  if (!key) {
    logger.warn('Skipping endpoint with empty path key');
    return null;
  }

  return parseJsonRateLimits(
    normalizeEndpointValue(value),
    DEFAULT_AUTHENTICATED_RATE_LIMIT,
    `endpoint "${key}"`
  );
}

function parseEndpoints(rawEndpoints: unknown): Record<string, RateLimitEntry> {
  const endpoints: Record<string, RateLimitEntry> = {};

  if (!rawEndpoints || typeof rawEndpoints !== 'object' || Array.isArray(rawEndpoints)) {
    return endpoints;
  }

  for (const [path, value] of Object.entries(rawEndpoints)) {
    try {
      const limit = parseEndpointEntry(path, value);
      if (limit) {
        endpoints[String(path).trim()] = limit;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn(
        { path, error: errorMessage },
        'Failed to parse endpoint rate limit'
      );
    }
  }

  return endpoints;
}

export function parseRateLimitConfig(raw: Record<string, unknown> | null | undefined): RateLimitConfig {
  const global = parseJsonRateLimits(
    (raw?.global && typeof raw.global === 'object') ? (raw.global as Record<string, unknown>) : null,
    DEFAULT_GLOBAL_RATE_LIMIT,
    'global rate limit'
  );
  const authenticated = parseJsonRateLimits(
    (raw?.authenticated && typeof raw.authenticated === 'object') ? (raw.authenticated as Record<string, unknown>) : null,
    DEFAULT_AUTHENTICATED_RATE_LIMIT,
    'authenticated rate limit'
  );
  const endpoints = parseEndpoints(raw?.endpoints);

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
