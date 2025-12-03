import { validatePassword } from '../../../src/auth/src/utils/password-validator.js';
import { PasswordPolicy } from '../../../src/auth/src/types/password.js';
import { describe, it, expect } from 'vitest';


describe('Password validator', () => {

  const policy: PasswordPolicy = {
    minLength: 8,
    maxLength: 30,
    isUppercase: true,
    isLowercase: true,
    isNumber: true,
    isSpecialChar: true,
    isSpaces: false
  };

  it('validates a strong password successfully', () => {
    const result = validatePassword('StrongP@ssw0rd!', policy);
    expect(result.valid).toBe(true);
    expect(result.msg).toHaveLength(0);
  });

  it('fails validation for a short password', () => {
    const result = validatePassword('Short1!', policy);
    expect(result.valid).toBe(false);
    expect(result.msg).not.toHaveLength(0);
  });

  it('fails validation for a long password', () => {
    const result = validatePassword('ThisPasswordIsWayTooLongToBeAccepted123!', policy);
    expect(result.valid).toBe(false);
    expect(result.msg).not.toHaveLength(0);
  });

  it('fails validation for a password without uppercase letters', () => {
    const result = validatePassword('weakp@ssw0rd', policy);
    expect(result.valid).toBe(false);
    expect(result.msg).not.toHaveLength(0);
  });

  it('fails validation for a password without lowercase letters', () => {
    const result = validatePassword('WEAKP@SSW0RD', policy);
    expect(result.valid).toBe(false);
    expect(result.msg).not.toHaveLength(0);
  });

  it('fails validation for a password without numbers', () => {
    const result = validatePassword('NoNumbers@', policy);
    expect(result.valid).toBe(false);
    expect(result.msg).not.toHaveLength(0);
  });

  it('fails validation for a password without special characters', () => {
    const result = validatePassword('NoSpecial123', policy);
    expect(result.valid).toBe(false);
    expect(result.msg).not.toHaveLength(0);
  });

  it('fails validation for a password with spaces', () => {
    const result = validatePassword('Has Spaces1!', policy);
    expect(result.valid).toBe(false);
    expect(result.msg).not.toHaveLength(0);
  });

});
