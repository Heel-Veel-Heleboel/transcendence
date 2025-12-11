import { SaltLimitsShape } from '../../../src/auth/src/types/security.js';
import { getEnvSaltRounds } from '../../../src/auth/src/config/security.js';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';

describe('getEnvSaltRounds function', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const SaltLimits : SaltLimitsShape = {
    MIN_SALT_LENGTH: 4,
    MAX_SALT_LENGTH: 18,
    DEFAULT_SALT_LENGTH: 12
  };


  it('returns default salt rounds when env variable is not set', () => {
    delete process.env.BCRYPT_SALT_ROUNDS;
    const rounds = getEnvSaltRounds(SaltLimits.DEFAULT_SALT_LENGTH);
    expect(rounds).toBe(12);
  });

  it('returns valid salt rounds from env variable', () => {
    process.env.BCRYPT_SALT_ROUNDS = '10';
    const rounds = getEnvSaltRounds(SaltLimits.DEFAULT_SALT_LENGTH);
    expect(rounds).toBe(10);
  });

  it('returns NaN when env variable is invalid', () => {
    process.env.BCRYPT_SALT_ROUNDS = 'invalid';
    const rounds = getEnvSaltRounds(SaltLimits.DEFAULT_SALT_LENGTH);
    expect(rounds).toBe(NaN);
  });

  it('returns default salt rounds when env variable is empty', () => {
    process.env.BCRYPT_SALT_ROUNDS = '';
    const rounds = getEnvSaltRounds(SaltLimits.DEFAULT_SALT_LENGTH);
    expect(rounds).toBe(12);
  });
});