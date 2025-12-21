import { SECURITY_CONSTANTS } from '../entity/common';

/**
 * Validation utilities for configuration parsing
 */

/**
 * Validate and parse a positive integer
 * @throws Error if value is not a valid positive integer
 */
export function validatePositiveInteger(
  value: unknown,
  fieldName: string,
  context: string
): number {
  try {
    const strValue = String(value).trim();

    // Check for non-numeric characters (parseInt allows trailing non-digits like "123abc")
    if (!/^-?\d+$/.test(strValue)) {
      throw new Error(
        `${context} has invalid ${fieldName}: "${value}" contains non-numeric characters`
      );
    }

    const num = parseInt(strValue, 10);

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
    if (!Number.isInteger(num) || !Number.isSafeInteger(num)) {
      throw new Error(
        `${context} has invalid ${fieldName}: ${num} must be a safe integer`
      );
    }
    return num;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      `${context} has invalid ${fieldName}: unexpected error parsing "${value}"`
    );
  }
}

/**
 * Validate and parse a non-negative integer
 * @throws Error if value is not a valid non-negative integer
 */
export function validateNonNegativeInteger(
  value: unknown,
  fieldName: string,
  context: string
): number {
  try {
    const strValue = String(value).trim();

    // Check for non-numeric characters (parseInt allows trailing non-digits like "123abc")
    if (!/^-?\d+$/.test(strValue)) {
      throw new Error(
        `${context} has invalid ${fieldName}: "${value}" contains non-numeric characters`
      );
    }

    const num = parseInt(strValue, 10);

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
    if (!Number.isInteger(num) || !Number.isSafeInteger(num)) {
      throw new Error(
        `${context} has invalid ${fieldName}: ${num} must be a safe integer`
      );
    }
    return num;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      `${context} has invalid ${fieldName}: unexpected error parsing "${value}"`
    );
  }
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
 * @throws Error if port is invalid
 */
export function validatePort(value: unknown, context: string): number {
  try {
    const strValue = String(value).trim();

    // Check for non-numeric characters
    if (!/^\d+$/.test(strValue)) {
      throw new Error(
        `${context} has invalid port: "${value}" contains non-numeric characters`
      );
    }

    const num = parseInt(strValue, 10);

    if (isNaN(num)) {
      throw new Error(
        `${context} has invalid port: "${value}" is not a number`
      );
    }
    if (!Number.isInteger(num) || !Number.isSafeInteger(num)) {
      throw new Error(
        `${context} has invalid port: ${num} must be a safe integer`
      );
    }
    if (num < SECURITY_CONSTANTS.MIN_PORT || num > SECURITY_CONSTANTS.MAX_PORT) {
      throw new Error(
        `${context} has invalid port: ${num} must be between ${SECURITY_CONSTANTS.MIN_PORT} and ${SECURITY_CONSTANTS.MAX_PORT}`
      );
    }
    return num;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      `${context} has invalid port: unexpected error parsing "${value}"`
    );
  }
}
