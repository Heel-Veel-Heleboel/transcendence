import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createPasswordPolicyConfig } from '../../../src/auth/src/config/password.js';
import type { PasswordConfigLimits } from '../../../src/auth/src/types/password.js';

describe('Password Length Limits Validator', () => {
  const originalEnv = process.env;

  const limits: PasswordConfigLimits = {
    MIN_LENGTH_LOWER_BOUND: 6,
    MIN_LENGTH_UPPER_BOUND: 64,
    MAX_LENGTH_LOWER_BOUND: 12,
    MAX_LENGTH_UPPER_BOUND: 128,
    DEFAULT_MIN_LENGTH: 8,
    DEFAULT_MAX_LENGTH: 32
  };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.PASSWORD_MIN_LENGTH;
    delete process.env.PASSWORD_MAX_LENGTH;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('NaN validation', () => {
    it('should throw error when PASSWORD_MIN_LENGTH is not a number', () => {
      process.env.PASSWORD_MIN_LENGTH = 'abc';
      
      expect(() => createPasswordPolicyConfig(limits))
        .toThrow('PASSWORD_MIN_LENGTH is not a valid number');
    });

    it('should throw error when PASSWORD_MAX_LENGTH is not a number', () => {
      process.env.PASSWORD_MAX_LENGTH = 'xyz';
      
      expect(() => createPasswordPolicyConfig(limits))
        .toThrow('PASSWORD_MAX_LENGTH is not a valid number');
    });

    // Change this test - empty string should use defaults
    it('should use default when PASSWORD_MIN_LENGTH is empty string', () => {
      process.env.PASSWORD_MIN_LENGTH = '';
      process.env.PASSWORD_MAX_LENGTH = '32';
      
      const policy = createPasswordPolicyConfig(limits);
      expect(policy.minLength).toBe(8); // Uses DEFAULT_MIN_LENGTH
    });

    it('should use default when PASSWORD_MAX_LENGTH is empty string', () => {
      process.env.PASSWORD_MIN_LENGTH = '8';
      process.env.PASSWORD_MAX_LENGTH = '';
      
      const policy = createPasswordPolicyConfig(limits);
      expect(policy.maxLength).toBe(32); // Uses DEFAULT_MAX_LENGTH
    });
  });

  describe('Boundary validation', () => {
    it('should throw error for min length below lower bound', () => {
      process.env.PASSWORD_MIN_LENGTH = '4';
      process.env.PASSWORD_MAX_LENGTH = '32';
      
      expect(() => createPasswordPolicyConfig(limits))
        .toThrow('PASSWORD_MIN_LENGTH must be between 6 and 64, got: 4');
    });

    it('should throw error for min length above upper bound', () => {
      process.env.PASSWORD_MIN_LENGTH = '70';
      process.env.PASSWORD_MAX_LENGTH = '128';
      
      expect(() => createPasswordPolicyConfig(limits))
        .toThrow('PASSWORD_MIN_LENGTH must be between 6 and 64, got: 70');
    });

    it('should throw error for max length below lower bound', () => {
      process.env.PASSWORD_MIN_LENGTH = '8';
      process.env.PASSWORD_MAX_LENGTH = '10';
      
      expect(() => createPasswordPolicyConfig(limits))
        .toThrow('PASSWORD_MAX_LENGTH must be between 12 and 128, got: 10');
    });

    it('should throw error for max length above upper bound', () => {
      process.env.PASSWORD_MIN_LENGTH = '8';
      process.env.PASSWORD_MAX_LENGTH = '150';
      
      expect(() => createPasswordPolicyConfig(limits))
        .toThrow('PASSWORD_MAX_LENGTH must be between 12 and 128, got: 150');
    });
  });

  describe('Min vs Max validation', () => {
    it('should throw error when min equals max', () => {
      process.env.PASSWORD_MIN_LENGTH = '30';
      process.env.PASSWORD_MAX_LENGTH = '30';
      
      expect(() => createPasswordPolicyConfig(limits))
        .toThrow('PASSWORD_MIN_LENGTH (30) must be less than PASSWORD_MAX_LENGTH (30)');
    });

    it('should throw error when min is greater than max', () => {
      process.env.PASSWORD_MIN_LENGTH = '40';
      process.env.PASSWORD_MAX_LENGTH = '30';
      
      expect(() => createPasswordPolicyConfig(limits))
        .toThrow('PASSWORD_MIN_LENGTH (40) must be less than PASSWORD_MAX_LENGTH (30)');
    });
  });

  describe('Default values', () => {
    it('should use defaults when env vars not set', () => {
      delete process.env.PASSWORD_MIN_LENGTH;
      delete process.env.PASSWORD_MAX_LENGTH;
      
      const policy = createPasswordPolicyConfig(limits);
      expect(policy.minLength).toBe(8);
      expect(policy.maxLength).toBe(32);
    });
  });

  describe('Valid configurations', () => {
    it('should accept valid configuration', () => {
      process.env.PASSWORD_MIN_LENGTH = '10';
      process.env.PASSWORD_MAX_LENGTH = '50';
      
      const policy = createPasswordPolicyConfig(limits);
      expect(policy.minLength).toBe(10);
      expect(policy.maxLength).toBe(50);
      expect(policy.requiredUppercase).toBe(true);
      expect(policy.requiredLowercase).toBe(true);
      expect(policy.requiredNumber).toBe(true);
      expect(policy.requiredSpecialChar).toBe(true);
      expect(policy.allowSpaces).toBe(false);
    });
  });
});