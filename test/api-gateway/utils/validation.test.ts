import { describe, it, expect } from 'vitest';
import {
  validateIntegerRange,
  validateUrl,
  normalizeBoolean,
  parseJsonSafe,
  validateTimeWindow,
  validatePort
} from '../../../src/api-gateway/src/utils/validation';

describe('Validation utilities', () => {
  describe('validateIntegerRange', () => {
    it('accepts valid integers within range', () => {
      expect(validateIntegerRange(5, 'field', 'context', 1, 10)).toBe(5);
      expect(validateIntegerRange('10', 'field', 'context', 1, 100)).toBe(10);
      expect(validateIntegerRange(0, 'field', 'context', 0, 100)).toBe(0);
      expect(validateIntegerRange(1000, 'field', 'context', 1)).toBe(1000); // no max
    });

    it('throws on values below minimum', () => {
      expect(() => validateIntegerRange(0, 'field', 'context', 1)).toThrow(/must be at least 1/);
      expect(() => validateIntegerRange(-5, 'field', 'context', 0)).toThrow(/must be at least 0/);
    });

    it('throws on values above maximum', () => {
      expect(() => validateIntegerRange(11, 'field', 'context', 1, 10)).toThrow(/must be at most 10/);
      expect(() => validateIntegerRange(100, 'field', 'context', 0, 50)).toThrow(/must be at most 50/);
    });

    it('throws on non-numeric strings', () => {
      expect(() => validateIntegerRange('invalid', 'field', 'context', 0)).toThrow(/contains non-numeric characters/);
      expect(() => validateIntegerRange('5.5', 'field', 'context', 0)).toThrow(/contains non-numeric characters/);
      expect(() => validateIntegerRange('123abc', 'field', 'context', 0)).toThrow(/contains non-numeric characters/);
    });

    it('throws on floats', () => {
      expect(() => validateIntegerRange(5.5, 'field', 'context', 0)).toThrow(/contains non-numeric characters/);
      expect(() => validateIntegerRange(2.5, 'field', 'context', 0)).toThrow(/contains non-numeric characters/);
    });

    it('throws on unsafe integers', () => {
      expect(() => validateIntegerRange(Number.MAX_SAFE_INTEGER + 1, 'field', 'context', 0)).toThrow(/must be a safe integer/);
      expect(() => validateIntegerRange('9007199254740992', 'field', 'context', 0)).toThrow(/must be a safe integer/);
    });

    it('handles string inputs with trailing/leading whitespace', () => {
      expect(validateIntegerRange('  42  ', 'field', 'context', 0, 100)).toBe(42);
      expect(validateIntegerRange('\t10\n', 'field', 'context', 0, 100)).toBe(10);
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
      expect(() => validatePort(0, 'context')).toThrow(/must be at least 1/);
      expect(() => validatePort(-1, 'context')).toThrow(/must be at least 1/);
      expect(() => validatePort(65536, 'context')).toThrow(/must be at most 65535/);
      expect(() => validatePort(100000, 'context')).toThrow(/must be at most 65535/);
    });

    it('throws on invalid inputs', () => {
      expect(() => validatePort(3000.5, 'context')).toThrow(/contains non-numeric characters/);
      expect(() => validatePort('invalid', 'context')).toThrow(/contains non-numeric characters/);
      expect(() => validatePort('3000abc', 'context')).toThrow(/contains non-numeric characters/);
    });
  });
});
