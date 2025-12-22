import { SECURITY_CONSTANTS } from '../entity/common';

/**
 * Validation utilities for configuration parsing
 */

/**
 * Validate and parse an integer within specified bounds
 *
 * @param value - The value to validate
 * @param fieldName - Name of the field for error messages
 * @param context - Context for error messages
 * @param min - Minimum allowed value (inclusive)
 * @param max - Maximum allowed value (inclusive, optional)
 * @throws Error if value is not a valid integer or outside bounds
 *
 * @example
 * validateIntegerRange(port, 'port', 'config', 1, 65535)
 * validateIntegerRange(timeout, 'timeout', 'service', 1) // positive integers
 * validateIntegerRange(retries, 'retries', 'service', 0) // non-negative integers
 */
export function validateIntegerRange(
  value: unknown,
  fieldName: string,
  context: string,
  min: number,
  max?: number
): number {
  const strValue = String(value).trim();

  // Check for non-numeric characters (parseInt allows trailing non-digits like "123abc")
  if (!/^-?\d+$/.test(strValue)) {
    throw new Error(
      `${context} has invalid ${fieldName}: "${value}" contains non-numeric characters`
    );
  }

  const num = parseInt(strValue, 10);

  if (!Number.isSafeInteger(num)) {
    throw new Error(
      `${context} has invalid ${fieldName}: ${num} must be a safe integer`
    );
  }

  if (num < min) {
    throw new Error(
      `${context} has invalid ${fieldName}: ${num} must be at least ${min}`
    );
  }

  if (max !== undefined && num > max) {
    throw new Error(
      `${context} has invalid ${fieldName}: ${num} must be at most ${max}`
    );
  }

  return num;
}


/**
 * Validate URL format and protocol
 * Only allows http and https protocols for security
 * @throws Error if URL is invalid or uses disallowed protocol
 */
export function validateUrl(url: string, context: string): void {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(`${context} has invalid URL: "${url}"`);
  }

  // Only allow http and https protocols
  const allowedProtocols = ['http:', 'https:'];
  if (!allowedProtocols.includes(parsedUrl.protocol)) {
    throw new Error(
      `${context} has invalid URL protocol: "${parsedUrl.protocol}" (only http: and https: are allowed)`
    );
  }
}

/**
 * Normalize boolean value from various input types
 */
export function normalizeBoolean(value: unknown): boolean {
  if (value === true || String(value).toLowerCase() === 'true') {
    return true;
  }
  return false;
}

/**
 * Parse JSON with better error messages
 */
export function parseJsonSafe(jsonString: string, source: string): unknown {
  try {
    return JSON.parse(jsonString);
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    throw new Error(
      `Invalid JSON in ${source}: ${errorMessage}`
    );
  }
}

/**
 * Validate time window format for rate limiting
 * Accepts formats like "1 minute", "30 seconds", "1 hour", etc.
 * @throws Error if format is invalid
 */
export function validateTimeWindow(value: unknown, context: string): string {
  const timeWindow = String(value || '').trim();
  if (!timeWindow) {
    throw new Error(`${context} has invalid timeWindow: cannot be empty`);
  }

  // Fastify rate-limit accepts formats like "1 minute", "30 seconds", "1 hour"
  // Pattern: number followed by time unit (ms, second(s), minute(s), hour(s), day(s), week(s), month(s))
  const validPattern = /^\d+\s+(ms|milliseconds?|seconds?|minutes?|hours?|days?|weeks?|months?)$/i;

  if (!validPattern.test(timeWindow)) {
    throw new Error(
      `${context} has invalid timeWindow: "${timeWindow}" must be in format "N unit" (e.g., "1 minute", "30 seconds")`
    );
  }

  return timeWindow;
}

/**
 * Validate and parse port number
 * @throws Error if port is invalid (must be between 1 and 65535)
 */
export function validatePort(value: unknown, context: string): number {
  return validateIntegerRange(
    value,
    'port',
    context,
    SECURITY_CONSTANTS.MIN_PORT,
    SECURITY_CONSTANTS.MAX_PORT
  );
}
