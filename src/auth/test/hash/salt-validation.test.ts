import { describe, it, expect } from 'vitest';
import { SaltLimits } from '../../src/constants/password.js';
import { validateSaltLengthLimits } from '../../src/validators/hash.js';

describe('Salt Length Validation', () => {
  it('passes valid salt rounds within limits', () => {
    expect(() => validateSaltLengthLimits(4, SaltLimits)).not.toThrow();
    expect(() => validateSaltLengthLimits(12, SaltLimits)).not.toThrow();
    expect(() => validateSaltLengthLimits(18, SaltLimits)).not.toThrow();
  });

  it('throws error for salt rounds below minimum limit', () => {
    expect(() => validateSaltLengthLimits(0, SaltLimits)).toThrow(`BCRYPT_SALT_ROUNDS must be between ${SaltLimits.MIN_SALT_LENGTH} and ${SaltLimits.MAX_SALT_LENGTH}, got: 0`);
  });

  it('throws error for salt rounds above maximum limit', () => {
    expect(() => validateSaltLengthLimits(19, SaltLimits)).toThrow(`BCRYPT_SALT_ROUNDS must be between ${SaltLimits.MIN_SALT_LENGTH} and ${SaltLimits.MAX_SALT_LENGTH}, got: 19`);
  });

  it('throws error for NaN salt rounds', () => {
    expect(() => validateSaltLengthLimits(NaN, SaltLimits)).toThrow('BCRYPT_SALT_ROUNDS is not a valid intiger: got NaN');
  });
});
