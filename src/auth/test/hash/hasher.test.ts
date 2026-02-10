import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { passwordHasher, comparePasswordHash } from '../../src/utils/password-hash.js';
import { SaltLimits } from '../../src/constants/password.js';

describe('passwordHasher utility', () => {
  const testString = 'TestPassword123!';
  
  // Save original environment
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
    // Set a valid salt rounds value
    process.env.BCRYPT_SALT_ROUNDS = '10';
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('hashes a string successfully', async () => {
    const hash = await passwordHasher(testString, SaltLimits);
    
    expect(hash).toBeDefined();
    expect(hash).not.toBe(testString);
  });

  it('compares a string to its hash successfully', async () => {
    const hash = await passwordHasher(testString, SaltLimits);
    const isMatch = await comparePasswordHash(testString, hash);
    
    expect(isMatch).toBe(true);
  });

  it('fails comparison for a different string', async () => {
    const hash = await passwordHasher(testString, SaltLimits);
    const isMatch = await comparePasswordHash('DifferentPassword!', hash);
    
    expect(isMatch).toBe(false);
  });

  // FIXED: Correct way to test async errors
  it('throws error when input password is empty', async () => {
    await expect(passwordHasher('', SaltLimits))
      .rejects.toThrow('Input password is required');
  });

  it('returns false when comparing with empty string', async () => {
    const hash = await passwordHasher(testString, SaltLimits);
    const isMatch = await comparePasswordHash('', hash);
    
    expect(isMatch).toBe(false);
  });

  it('returns false when hash is empty', async () => {
    const isMatch = await comparePasswordHash(testString, '');
    
    expect(isMatch).toBe(false);
  });

  it ('returns false when both string and hash are empty', async () => {
    const isMatch = await comparePasswordHash('', '');
    
    expect(isMatch).toBe(false);
  });

  it('produces different hashes for same input', async () => {
    const hash1 = await passwordHasher(testString, SaltLimits);
    const hash2 = await passwordHasher(testString, SaltLimits);
    
    // bcrypt includes random salt, so hashes differ
    expect(hash1).not.toBe(hash2);
    
    // But both should match the original
    expect(await comparePasswordHash(testString, hash1)).toBe(true);
    expect(await comparePasswordHash(testString, hash2)).toBe(true);
  });

  it('throws error when salt rounds env var is invalid', async () => {
    process.env.BCRYPT_SALT_ROUNDS = '0'; // Too low
    
    await expect(passwordHasher(testString, SaltLimits))
      .rejects.toThrow('BCRYPT_SALT_ROUNDS must be between 1 and 18, got: 0');
  });

  it('uses default salt rounds when env var not set', async () => {
    delete process.env.BCRYPT_SALT_ROUNDS;
    
    const hash = await passwordHasher(testString, SaltLimits);
    
    expect(hash).toBeDefined();
    expect(await comparePasswordHash(testString, hash)).toBe(true);

  });
});