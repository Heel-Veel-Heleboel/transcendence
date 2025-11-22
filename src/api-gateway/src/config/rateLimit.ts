import { RateLimitConfig, RateLimitEntry, EndpointRateLimit } from '../entity/common';
import fs from 'fs';

function getDefaultGlobal(): RateLimitEntry {
  return { max: 1000, timeWindow: '1 minute' };
}

function getDefaultAuthenticated(): RateLimitEntry {
  return { max: 2000, timeWindow: '1 minute' };
}

export function parseJsonRateLimits(raw: any, defaultEntry: RateLimitEntry): RateLimitEntry {
  if (!raw || typeof raw !== 'object') {
    console.warn(`Invalid rate limit input; falling back to defaults`);
    return defaultEntry;
  }

  const max = Number(raw.max) || defaultEntry.max;
  const timeWindow = String(raw.timeWindow) || defaultEntry.timeWindow;

  return { max, timeWindow };
}

export function parseJsonEndpointRateLimits(raw: any, defaultEntry: RateLimitEntry): EndpointRateLimit {
    if (!raw || typeof raw !== 'object') {
        throw new Error('endpoint rate limit entry must be an object');
    }

    const path = String(raw.path || '').trim();
    if (!path) {
        throw new Error('endpoint rate limit entry missing required "path" field');
    }
    const limit = parseJsonRateLimits(raw.limit, defaultEntry);
    return { path, limit };
}

export function parseRateLimitConfig(raw: any): RateLimitConfig {

  const defaultGlobal = getDefaultGlobal();
  const defaultAuthenticated = getDefaultAuthenticated();

  const global = parseJsonRateLimits(raw?.global, defaultGlobal);
  const authenticated = parseJsonRateLimits(raw?.authenticated, defaultAuthenticated);

  // Normalize endpoints into a map for fast lookup: Record<path, RateLimitEntry>
  const endpoints: Record<string, RateLimitEntry> = {};

  // Accept array shape: [{ path, limit: { ... } }, ...]
  if (Array.isArray(raw?.endpoints)) {
    for (const endpoint of raw.endpoints) {
      try {
        const parsed = parseJsonEndpointRateLimits(endpoint, defaultAuthenticated);
        endpoints[parsed.path] = parsed.limit;
      } catch (error: any) {
        console.warn(`Failed to parse endpoint rate limit: ${error.message}`);
      }
    }
  }

  // Accept object/map shape: { "/path": { max, timeWindow }, ... }
  else if (raw?.endpoints && typeof raw.endpoints === 'object') {
    for (const [path, value] of Object.entries(raw.endpoints)) {
      try {
        const key = String(path).trim();
        if (!key) {
          console.warn(`Skipping endpoint with empty path key`);
          continue;
        }
        const limit = parseJsonRateLimits(value, defaultAuthenticated);
        endpoints[key] = limit;
      } catch (error: any) {
        console.warn(`Failed to parse endpoint rate limit for ${path}: ${error.message}`);
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
      throw new Error(`RATE_LIMITS_FILE is set but file does not exist: ${limitsFile}`);
    }
    const raw = fs.readFileSync(limitsFile, 'utf8');
    const parsed = JSON.parse(raw);
    return parseRateLimitConfig(parsed);
  }

  // 2) RATE_LIMITS env var
  if (process.env.RATE_LIMITS) {
    const parsed = JSON.parse(process.env.RATE_LIMITS);
    return parseRateLimitConfig(parsed);
  }

  // 3) none provided -> defaults
  return parseRateLimitConfig(undefined);
}