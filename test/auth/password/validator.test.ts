import { describe, it, expect } from 'vitest';
import { PasswordPolicyConfig } from '../../../src/auth/src/types/password.js';
import {
  checkLowercase,
  checkNumber,
  checkSpace,
  checkUppercase,
  checkMinLength,
  checkMaxLength,
  checkSpecialChar,
  validatePassword
} from '../../../src/auth/src/validators/password.js';


describe('validatePassword', () => {
  const strictPolicy: PasswordPolicyConfig = {
    minLength: 8,
    maxLength: 30,
    requiredUppercase: true,
    requiredLowercase: true,
    requiredNumber: true,
    requiredSpecialChar: true,
    allowSpaces: false
  };

  const lenientPolicy: PasswordPolicyConfig = {
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



describe('Password Validators', () => {

  const policy = {
    minLength: 8,
    maxLength: 20,
    requiredNumber: true,
    requiredUppercase: true,
    requiredLowercase: true,
    requiredSpecialChar: true,
    allowSpaces: false
  };

  it('checkMinLength should return TOO_SHORT for short passwords', () => {
    expect(checkMinLength('short', policy)).toBe('TOO_SHORT');
    expect(checkMinLength('longenough', policy)).toBeNull();
  });

  it('checkSpace should return HAS_SPACE for passwords with spaces when not allowed', () => {
    expect(checkSpace('has space', policy)).toBe('HAS_SPACE');
    expect(checkSpace('nospaceshere', policy)).toBeNull();
  });

  it('checkSpecialChar should return NO_SPECIAL for passwords without special characters when required', () => {
    expect(checkSpecialChar('NoSpecial1A', policy)).toBe('NO_SPECIAL');
    expect(checkSpecialChar('Has$pecial1A', policy)).toBeNull();
  });

  it('checkNumber should return NO_NUMBER for passwords without numbers when required', () => {
    expect(checkNumber('NoNumber!', policy)).toBe('NO_NUMBER');
    expect(checkNumber('HasNumber1!', policy)).toBeNull();
  });

  it('checkUppercase should return NO_UPPERCASE for passwords without uppercase letters when required', () => {
    expect(checkUppercase('nouppercase1!', policy)).toBe('NO_UPPERCASE');
    expect(checkUppercase('HasUppercase1!', policy)).toBeNull();
  });

  it('checkLowercase should return NO_LOWERCASE for passwords without lowercase letters when required', () => {
    expect(checkLowercase('NOLOWERCASE1!', policy)).toBe('NO_LOWERCASE');
    expect(checkLowercase('HasLowercase1!', policy)).toBeNull();
  });

  it('checkMaxLength should return TOO_LONG for passwords that are too long', () => {
    expect(checkMaxLength('ThisPasswordIsWayTooLong123!', policy)).toBe('TOO_LONG');
    expect(checkMaxLength('Short1!', policy)).toBeNull();
  });

});