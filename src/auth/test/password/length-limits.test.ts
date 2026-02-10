import { describe, it, expect } from 'vitest';
import { createPasswordPolicyConfig } from '../../../src/auth/src/config/password.js';
import type { IPasswordLimitsConfig } from '../../../src/auth/src/types/password.js';

describe('Password Length Limits Validator', () => {
  const limits: IPasswordLimitsConfig = {
    MIN_LENGTH_LOWER_BOUND: 6,
    MIN_LENGTH_UPPER_BOUND: 64,
    MAX_LENGTH_LOWER_BOUND: 12,
    MAX_LENGTH_UPPER_BOUND: 128,
    DEFAULT_MIN_LENGTH: 8,
    DEFAULT_MAX_LENGTH: 32
  };

  describe('NaN validation', () => {
    it('should throw error when minLength is NaN', () => {
      expect(() => createPasswordPolicyConfig(NaN, 32, limits))
        .toThrow('PASSWORD_MIN_LENGTH is not a valid intiger');
    });

    it('should throw error when maxLength is NaN', () => {
      expect(() => createPasswordPolicyConfig(8, NaN, limits))
        .toThrow('PASSWORD_MAX_LENGTH is not a valid intiger');
    });

    it('should throw error when both are NaN', () => {
      expect(() => createPasswordPolicyConfig(NaN, NaN, limits))
        .toThrow('PASSWORD_MIN_LENGTH is not a valid intiger');
    });
  });

  describe('Boundary validation', () => {
    it('should throw error for min length below lower bound', () => {
      expect(() => createPasswordPolicyConfig(4, 32, limits))
        .toThrow('PASSWORD_MIN_LENGTH must be between 6 and 64, got: 4');
    });

    it('should throw error for min length above upper bound', () => {
      expect(() => createPasswordPolicyConfig(70, 128, limits))
        .toThrow('PASSWORD_MIN_LENGTH must be between 6 and 64, got: 70');
    });

    it('should throw error for max length below lower bound', () => {
      expect(() => createPasswordPolicyConfig(8, 10, limits))
        .toThrow('PASSWORD_MAX_LENGTH must be between 12 and 128, got: 10');
    });

    it('should throw error for max length above upper bound', () => {
      expect(() => createPasswordPolicyConfig(8, 150, limits))
        .toThrow('PASSWORD_MAX_LENGTH must be between 12 and 128, got: 150');
    });

    it('should accept min length at lower bound', () => {
      const policy = createPasswordPolicyConfig(6, 32, limits);
      expect(policy.minLength).toBe(6);
    });

    it('should accept min length at upper bound', () => {
      const policy = createPasswordPolicyConfig(64, 128, limits);
      expect(policy.minLength).toBe(64);
    });

    it('should accept max length at lower bound', () => {
      const policy = createPasswordPolicyConfig(8, 12, limits);
      expect(policy.maxLength).toBe(12);
    });

    it('should accept max length at upper bound', () => {
      const policy = createPasswordPolicyConfig(8, 128, limits);
      expect(policy.maxLength).toBe(128);
    });
  });

  describe('Min vs Max validation', () => {
    it('should throw error when min equals max', () => {
      expect(() => createPasswordPolicyConfig(30, 30, limits))
        .toThrow('PASSWORD_MIN_LENGTH (30) must be less than PASSWORD_MAX_LENGTH (30)');
    });

    it('should throw error when min is greater than max', () => {
      expect(() => createPasswordPolicyConfig(40, 30, limits))
        .toThrow('PASSWORD_MIN_LENGTH (40) must be less than PASSWORD_MAX_LENGTH (30)');
    });

    it('should accept when min is less than max', () => {
      const policy = createPasswordPolicyConfig(10, 30, limits);
      expect(policy.minLength).toBe(10);
      expect(policy.maxLength).toBe(30);
    });

    it('should accept minimum valid range (1 character difference)', () => {
      const policy = createPasswordPolicyConfig(11, 12, limits);
      expect(policy.minLength).toBe(11);
      expect(policy.maxLength).toBe(12);
    });
  });

  describe('Custom constraints', () => {
    it('should work with different constraint bounds', () => {
      const customLimits: IPasswordLimitsConfig = {
        MIN_LENGTH_LOWER_BOUND: 1,
        MIN_LENGTH_UPPER_BOUND: 20,
        MAX_LENGTH_LOWER_BOUND: 10,
        MAX_LENGTH_UPPER_BOUND: 50,
        DEFAULT_MIN_LENGTH: 5,
        DEFAULT_MAX_LENGTH: 25
      } ;

      const policy = createPasswordPolicyConfig(5, 25, customLimits);
      expect(policy.minLength).toBe(5);
      expect(policy.maxLength).toBe(25);
    });

    it('should reject values outside custom bounds', () => {
      const customLimits: IPasswordLimitsConfig = {
        MIN_LENGTH_LOWER_BOUND: 10,
        MIN_LENGTH_UPPER_BOUND: 20,
        MAX_LENGTH_LOWER_BOUND: 30,
        MAX_LENGTH_UPPER_BOUND: 50,
        DEFAULT_MIN_LENGTH: 12,
        DEFAULT_MAX_LENGTH: 35
      };

      expect(() => createPasswordPolicyConfig(5, 35, customLimits))
        .toThrow('PASSWORD_MIN_LENGTH must be between 10 and 20, got: 5');
    });
  });

  describe('Valid configurations', () => {
    it('should create valid policy with correct properties', () => {
      const policy = createPasswordPolicyConfig(10, 50, limits);
      
      expect(policy.minLength).toBe(10);
      expect(policy.maxLength).toBe(50);
      expect(policy.requiredUppercase).toBe(true);
      expect(policy.requiredLowercase).toBe(true);
      expect(policy.requiredNumber).toBe(true);
      expect(policy.requiredSpecialChar).toBe(true);
      expect(policy.allowSpaces).toBe(false);
    });

    it('should create policy with default lengths', () => {
      const policy = createPasswordPolicyConfig(
        limits.DEFAULT_MIN_LENGTH,
        limits.DEFAULT_MAX_LENGTH,
        limits
      );
      
      expect(policy.minLength).toBe(8);
      expect(policy.maxLength).toBe(32);
    });
  });

  describe('Edge cases', () => {
    it('should handle very small valid range', () => {
      const policy = createPasswordPolicyConfig(6, 12, limits);
      expect(policy.minLength).toBe(6);
      expect(policy.maxLength).toBe(12);
    });

    it('should handle very large valid range', () => {
      const policy = createPasswordPolicyConfig(6, 128, limits);
      expect(policy.minLength).toBe(6);
      expect(policy.maxLength).toBe(128);
    });

    it('should throw for negative minLength', () => {
      expect(() => createPasswordPolicyConfig(-5, 32, limits))
        .toThrow('PASSWORD_MIN_LENGTH must be between 6 and 64, got: -5');
    });

    it('should throw for negative maxLength', () => {
      expect(() => createPasswordPolicyConfig(8, -10, limits))
        .toThrow('PASSWORD_MAX_LENGTH must be between 12 and 128, got: -10');
    });

    it('should throw for zero minLength', () => {
      expect(() => createPasswordPolicyConfig(0, 32, limits))
        .toThrow('PASSWORD_MIN_LENGTH must be between 6 and 64, got: 0');
    });
  });
});