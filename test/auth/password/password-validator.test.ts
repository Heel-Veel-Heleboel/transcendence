import { describe, it, expect } from 'vitest';
import { validatePassword } from '../../../src/auth/src/utils/password/password-validator.js';
import { PasswordPolicy } from '../../../src/auth/src/types/password.js';

describe('validatePassword', () => {
  const strictPolicy: PasswordPolicy = {
    minLength: 8,
    maxLength: 30,
    requiredUppercase: true,
    requiredLowercase: true,
    requiredNumber: true,
    requiredSpecialChar: true,
    allowSpaces: false
  };

  const lenientPolicy: PasswordPolicy = {
    minLength: 4,
    maxLength: 50,
    requiredUppercase: false,
    requiredLowercase: false,
    requiredNumber: false,
    requiredSpecialChar: false,
    allowSpaces: true
  };

  describe('with strict policy', () => {
    it('should pass with valid password', () => {
      const result = validatePassword('MyPass123!', strictPolicy);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.messages).toEqual([]);
    });

    it('should fail with multiple errors', () => {
      const result = validatePassword('pass', strictPolicy);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('TOO_SHORT');
      expect(result.errors).toContain('NO_UPPERCASE');
      expect(result.errors).toContain('NO_NUMBER');
      expect(result.errors).toContain('NO_SPECIAL');
      expect(result.messages).toContain('Password must be at least 8 characters long.');
      expect(result.messages).toContain('Password must have at least 1 uppercase letter.');
      expect(result.messages).toContain('Password must have at least 1 number.');
      expect(result.messages).toContain('Password must have at least 1 special character.');
    });

    it('should fail when missing uppercase', () => {
      const result = validatePassword('mypass123!', strictPolicy);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('NO_UPPERCASE');
      expect(result.messages).toContain('Password must have at least 1 uppercase letter.');
    });

    it('should fail when missing number', () => {
      const result = validatePassword('MyPassword!', strictPolicy);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('NO_NUMBER');
      expect(result.messages).toContain('Password must have at least 1 number.');
    });

    it('should fail when contains spaces', () => {
      const result = validatePassword('My Pass123!', strictPolicy);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('HAS_SPACE');
      expect(result.messages).toContain('Password must not contain spaces.');
    });
  });

  describe('with lenient policy', () => {
    it('should pass with simple password', () => {
      const result = validatePassword('pass', lenientPolicy);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.messages).toEqual([]);
    });

    it('should allow spaces when policy permits', () => {
      const result = validatePassword('my password', lenientPolicy);
      expect(result.errors).toEqual([]);
      expect(result.messages).toEqual([]);
      expect(result.valid).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty password', () => {
      const result = validatePassword('', strictPolicy);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('TOO_SHORT');
      expect(result.messages.length).toBeGreaterThan(0);
    });

    it('should handle minimum length boundary', () => {
      const result = validatePassword('MyPass1!', strictPolicy);
      expect(result.errors).toEqual([]);
      expect(result.messages).toEqual([]);
      expect(result.valid).toBe(true);
    });

    it('should handle maximum length boundary', () => {
      const longPassword = 'MyPass1!' + 'a'.repeat(22); // exactly 30 chars
      const result = validatePassword(longPassword, strictPolicy);
      expect(result.errors).toEqual([]);
      expect(result.messages).toEqual([]);
      expect(result.valid).toBe(true);
    });

    it('should reject password exceeding max length', () => {
      const tooLong = 'MyPass1!' + 'a'.repeat(23); // 31 chars
      const result = validatePassword(tooLong, strictPolicy);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('TOO_LONG');
      expect(result.messages).toContain('Password must be at most 30 characters long.');
    });
  });

  describe('returns all errors at once', () => {
    it('should return all validation errors for completely invalid password', () => {
      const result = validatePassword('a', strictPolicy);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(4); // min length, uppercase, number, special char
      expect(result.errors).toContain('TOO_SHORT');
      expect(result.errors).toContain('NO_UPPERCASE');
      expect(result.errors).toContain('NO_NUMBER');
      expect(result.errors).toContain('NO_SPECIAL');
      expect(result.messages).toHaveLength(4); // min length, uppercase, number, special char
      expect(result.messages).toContain('Password must be at least 8 characters long.');
      expect(result.messages).toContain('Password must have at least 1 uppercase letter.');
      expect(result.messages).toContain('Password must have at least 1 number.');
      expect(result.messages).toContain('Password must have at least 1 special character.');
    });
  });
});