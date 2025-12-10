import { describe, it, expect, afterAll, beforeEach } from 'vitest';
import { SaltLimits } from '../../../src/auth/src/constants/security.js';
import { validateSaltLengthLimits } from '../../../src/auth/src/validators/hash.js';
import { getEnvSaltRounds } from '../../../src/auth/src/config/security.js';

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

describe('getEnvSaltRounds function', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns default salt rounds when env variable is not set', () => {
    delete process.env.BCRYPT_SALT_ROUNDS;
    const rounds = getEnvSaltRounds(SaltLimits);
    expect(rounds).toBe(12);
  });

  it('returns valid salt rounds from env variable', () => {
    process.env.BCRYPT_SALT_ROUNDS = '10';
    const rounds = getEnvSaltRounds(SaltLimits);
    expect(rounds).toBe(10);
  });

  it('throws error for invalid salt rounds in env variable', () => {
    process.env.BCRYPT_SALT_ROUNDS = '0';
    expect(() => getEnvSaltRounds(SaltLimits)).toThrow(`BCRYPT_SALT_ROUNDS must be between ${SaltLimits.MIN_SALT_LENGTH} and ${SaltLimits.MAX_SALT_LENGTH}, got: 0`);
  });

  it('throws error for NaN salt rounds in env variable', () => {
    process.env.BCRYPT_SALT_ROUNDS = 'invalid';
    expect(() => getEnvSaltRounds(SaltLimits)).toThrow('BCRYPT_SALT_ROUNDS is not a valid intiger: got NaN');
  });
});