import {
  checkLowercase,
  checkNumber,
  checkSpace,
  checkUppercase,
  checkMinLength,
  checkMaxLength,
  checkSpecialChar
} from '../../../src/auth/src/validators/index.js';
import { describe ,it, expect } from 'vitest';

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