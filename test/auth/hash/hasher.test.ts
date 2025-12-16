import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { hasher, compareHash } from '../../../src/auth/src/utils/password/hasher.js';
import { SaltLimits } from '../../../src/auth/src/constants/security.js';

describe('Hasher utility', () => {
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
    const hash = await hasher(testString, SaltLimits);
    
    expect(hash).toBeDefined();
    expect(hash).not.toBe(testString);
  });

  it('compares a string to its hash successfully', async () => {
    const hash = await hasher(testString, SaltLimits);
    const isMatch = await compareHash(testString, hash);
    
    expect(isMatch).toBe(true);
  });

  it('fails comparison for a different string', async () => {
    const hash = await hasher(testString, SaltLimits);
    const isMatch = await compareHash('DifferentPassword!', hash);
    
    expect(isMatch).toBe(false);
  });

  // FIXED: Correct way to test async errors
  it('throws error when input password is empty', async () => {
    await expect(hasher('', SaltLimits))
      .rejects.toThrow('Input password is required');
  });

  it('returns false when comparing with empty string', async () => {
    const hash = await hasher(testString, SaltLimits);
    const isMatch = await compareHash('', hash);
    
    expect(isMatch).toBe(false);
  });

  it('returns false when hash is empty', async () => {
    const isMatch = await compareHash(testString, '');
    
    expect(isMatch).toBe(false);
  });

  it ('returns false when both string and hash are empty', async () => {
    const isMatch = await compareHash('', '');
    
    expect(isMatch).toBe(false);
  });

  it('produces different hashes for same input', async () => {
    const hash1 = await hasher(testString, SaltLimits);
    const hash2 = await hasher(testString, SaltLimits);
    
    // bcrypt includes random salt, so hashes differ
    expect(hash1).not.toBe(hash2);
    
    // But both should match the original
    expect(await compareHash(testString, hash1)).toBe(true);
    expect(await compareHash(testString, hash2)).toBe(true);
  });

  it('throws error when salt rounds env var is invalid', async () => {
    process.env.BCRYPT_SALT_ROUNDS = '0'; // Too low
    
    await expect(hasher(testString, SaltLimits))
      .rejects.toThrow('BCRYPT_SALT_ROUNDS must be between 1 and 18, got: 0');
  });

  it('uses default salt rounds when env var not set', async () => {
    delete process.env.BCRYPT_SALT_ROUNDS;
    
    const hash = await hasher(testString, SaltLimits);
    
    expect(hash).toBeDefined();
    expect(await compareHash(testString, hash)).toBe(true);

  });
});