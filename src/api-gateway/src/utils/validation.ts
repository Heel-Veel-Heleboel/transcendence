/**
 * Validation utilities for configuration parsing
 */

/**
 * Validate and parse a positive integer
 * @throws Error if value is not a valid positive integer
 */
export function validatePositiveInteger(
  value: any,
  fieldName: string,
  context: string
): number {
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(
      `${context} has invalid ${fieldName}: "${value}" is not a number`
    );
  }
  if (num <= 0) {
    throw new Error(
      `${context} has invalid ${fieldName}: ${num} must be positive`
    );
  }
  if (!Number.isInteger(num)) {
    throw new Error(
      `${context} has invalid ${fieldName}: ${num} must be an integer`
    );
  }
  return num;
}

/**
 * Validate and parse a non-negative integer
 * @throws Error if value is not a valid non-negative integer
 */
export function validateNonNegativeInteger(
  value: any,
  fieldName: string,
  context: string
): number {
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(
      `${context} has invalid ${fieldName}: "${value}" is not a number`
    );
  }
  if (num < 0) {
    throw new Error(
      `${context} has invalid ${fieldName}: ${num} cannot be negative`
    );
  }
  if (!Number.isInteger(num)) {
    throw new Error(
      `${context} has invalid ${fieldName}: ${num} must be an integer`
    );
  }
  return num;
}

/**
 * Validate URL format
 * @throws Error if URL is invalid
 */
export function validateUrl(url: string, context: string): void {
  try {
    new URL(url);
  } catch {
    throw new Error(`${context} has invalid URL: "${url}"`);
  }
}

/**
 * Normalize boolean value from various input types
 */
export function normalizeBoolean(value: any): boolean {
  if (value === true || String(value).toLowerCase() === 'true') {
    return true;
  }
  return false;
}

/**
 * Parse JSON with better error messages
 */
export function parseJsonSafe(jsonString: string, source: string): any {
  try {
    return JSON.parse(jsonString);
  } catch (e: any) {
    throw new Error(
      `Invalid JSON in ${source}: ${e?.message || String(e)}`
    );
  }
}

/**
 * Validate time window format for rate limiting
 * Accepts formats like "1 minute", "30 seconds", "1 hour", etc.
 * @throws Error if format is invalid
 */
export function validateTimeWindow(value: any, context: string): string {
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
 * @throws Error if port is invalid
 */
export function validatePort(value: any, context: string): number {
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(
      `${context} has invalid port: "${value}" is not a number`
    );
  }
  if (!Number.isInteger(num)) {
    throw new Error(
      `${context} has invalid port: ${num} must be an integer`
    );
  }
  if (num < 1 || num > 65535) {
    throw new Error(
      `${context} has invalid port: ${num} must be between 1 and 65535`
    );
  }
  return num;
}
