import { describe, it, expect } from 'vitest';
import {
  validatePositiveInteger,
  validateNonNegativeInteger,
  validateUrl,
  normalizeBoolean,
  parseJsonSafe,
  validateTimeWindow,
  validatePort
} from '../../../src/api-gateway/src/utils/validation';

describe('Validation utilities', () => {
  describe('validatePositiveInteger', () => {
    it('accepts valid positive integers', () => {
      expect(validatePositiveInteger(5, 'field', 'context')).toBe(5);
      expect(validatePositiveInteger('10', 'field', 'context')).toBe(10);
      expect(validatePositiveInteger(1000, 'field', 'context')).toBe(1000);
    });

    it('throws on zero', () => {
      expect(() => validatePositiveInteger(0, 'field', 'context')).toThrow(/must be positive/);
    });

    it('throws on negative numbers', () => {
      expect(() => validatePositiveInteger(-5, 'field', 'context')).toThrow(/must be positive/);
    });

    it('throws on non-integers', () => {
      expect(() => validatePositiveInteger(5.5, 'field', 'context')).toThrow(/must be an integer/);
    });

    it('throws on NaN', () => {
      expect(() => validatePositiveInteger('invalid', 'field', 'context')).toThrow(/is not a number/);
    });
  });

  describe('validateNonNegativeInteger', () => {
    it('accepts valid non-negative integers', () => {
      expect(validateNonNegativeInteger(0, 'field', 'context')).toBe(0);
      expect(validateNonNegativeInteger(5, 'field', 'context')).toBe(5);
      expect(validateNonNegativeInteger('10', 'field', 'context')).toBe(10);
    });

    it('throws on negative numbers', () => {
      expect(() => validateNonNegativeInteger(-1, 'field', 'context')).toThrow(/cannot be negative/);
    });

    it('throws on non-integers', () => {
      expect(() => validateNonNegativeInteger(2.5, 'field', 'context')).toThrow(/must be an integer/);
    });

    it('throws on NaN', () => {
      expect(() => validateNonNegativeInteger('invalid', 'field', 'context')).toThrow(/is not a number/);
    });
  });

  describe('validateUrl', () => {
    it('accepts valid URLs', () => {
      expect(() => validateUrl('http://example.com', 'context')).not.toThrow();
      expect(() => validateUrl('https://example.com:8080', 'context')).not.toThrow();
      expect(() => validateUrl('http://localhost:3000', 'context')).not.toThrow();
    });

    it('throws on invalid URLs', () => {
      expect(() => validateUrl('not-a-url', 'context')).toThrow(/invalid URL/);
      expect(() => validateUrl('', 'context')).toThrow(/invalid URL/);
      expect(() => validateUrl('just-text', 'context')).toThrow(/invalid URL/);
    });
  });

  describe('normalizeBoolean', () => {
    it('returns true for truthy values', () => {
      expect(normalizeBoolean(true)).toBe(true);
      expect(normalizeBoolean('true')).toBe(true);
      expect(normalizeBoolean('TRUE')).toBe(true);
      expect(normalizeBoolean('True')).toBe(true);
    });

    it('returns false for falsy values', () => {
      expect(normalizeBoolean(false)).toBe(false);
      expect(normalizeBoolean('false')).toBe(false);
      expect(normalizeBoolean('')).toBe(false);
      expect(normalizeBoolean(null)).toBe(false);
      expect(normalizeBoolean(undefined)).toBe(false);
      expect(normalizeBoolean(0)).toBe(false);
    });
  });

  describe('parseJsonSafe', () => {
    it('parses valid JSON', () => {
      expect(parseJsonSafe('{"key":"value"}', 'source')).toEqual({ key: 'value' });
      expect(parseJsonSafe('[]', 'source')).toEqual([]);
      expect(parseJsonSafe('123', 'source')).toBe(123);
    });

    it('throws with better error messages on invalid JSON', () => {
      expect(() => parseJsonSafe('invalid json', 'test source')).toThrow(/Invalid JSON in test source/);
      expect(() => parseJsonSafe('{key: value}', 'test source')).toThrow(/Invalid JSON in test source/);
    });
  });

  describe('validateTimeWindow', () => {
    it('accepts valid time window formats', () => {
      expect(validateTimeWindow('1 minute', 'context')).toBe('1 minute');
      expect(validateTimeWindow('30 seconds', 'context')).toBe('30 seconds');
      expect(validateTimeWindow('1 hour', 'context')).toBe('1 hour');
      expect(validateTimeWindow('5 minutes', 'context')).toBe('5 minutes');
      expect(validateTimeWindow('2 hours', 'context')).toBe('2 hours');
      expect(validateTimeWindow('1 day', 'context')).toBe('1 day');
      expect(validateTimeWindow('7 days', 'context')).toBe('7 days');
      expect(validateTimeWindow('500 ms', 'context')).toBe('500 ms');
      expect(validateTimeWindow('1000 milliseconds', 'context')).toBe('1000 milliseconds');
    });

    it('throws on invalid time window formats', () => {
      expect(() => validateTimeWindow('invalid', 'context')).toThrow(/must be in format/);
      expect(() => validateTimeWindow('1minute', 'context')).toThrow(/must be in format/);
      expect(() => validateTimeWindow('minute', 'context')).toThrow(/must be in format/);
      expect(() => validateTimeWindow('1 parsec', 'context')).toThrow(/must be in format/);
      expect(() => validateTimeWindow('', 'context')).toThrow(/cannot be empty/);
    });
  });

  describe('validatePort', () => {
    it('accepts valid port numbers', () => {
      expect(validatePort(80, 'context')).toBe(80);
      expect(validatePort(3000, 'context')).toBe(3000);
      expect(validatePort('8080', 'context')).toBe(8080);
      expect(validatePort(1, 'context')).toBe(1);
      expect(validatePort(65535, 'context')).toBe(65535);
    });

    it('throws on port numbers outside valid range', () => {
      expect(() => validatePort(0, 'context')).toThrow(/must be between 1 and 65535/);
      expect(() => validatePort(-1, 'context')).toThrow(/must be between 1 and 65535/);
      expect(() => validatePort(65536, 'context')).toThrow(/must be between 1 and 65535/);
      expect(() => validatePort(100000, 'context')).toThrow(/must be between 1 and 65535/);
    });

    it('throws on non-integer values', () => {
      expect(() => validatePort(3000.5, 'context')).toThrow(/must be an integer/);
      expect(() => validatePort(80.1, 'context')).toThrow(/must be an integer/);
    });

    it('throws on NaN', () => {
      expect(() => validatePort('invalid', 'context')).toThrow(/is not a number/);
      expect(() => validatePort('abc', 'context')).toThrow(/is not a number/);
    });
  });
});
