import { hasher, compareHash } from '../../../src/auth/src/utils/password/hasher';
import { describe, it, expect } from 'vitest';

describe('Hasher utility', () => {
  const testString = 'TestPassword123!';
  
  it('hashes a string successfully', async () => {
    const hash = await hasher(testString, 12);
    expect(hash).toBeDefined();
    expect(hash).not.toBe(testString);
  });

  it('compares a string to its hash successfully', async () => {
    const hash = await hasher(testString, 12);
    const isMatch = await compareHash(testString, hash);
    expect(isMatch).toBe(true);
  });

  it('fails comparison for a different string', async () => {
    const hash = await hasher(testString, 12);
    const isMatch = await compareHash('DifferentPassword!', hash);
    expect(isMatch).toBe(false);
  });

  it('handles empty string hashing and comparison', async () => {
    const emptyHash = await hasher('', 12);
    expect(emptyHash).toBeDefined();
    expect(emptyHash).not.toBe('');

    const isMatch = await compareHash('', emptyHash);
    expect(isMatch).toBe(true);
  });

  it('throws error for invalid salt rounds', async () => {
    await expect(hasher(testString, 3)).rejects.toThrow('Salt rounds must be between 4 and 18');
    await expect(hasher(testString, 19)).rejects.toThrow('Salt rounds must be between 4 and 18');
    await expect(hasher(testString, NaN)).rejects.toThrow('Invalid salt version');
    await expect(hasher(testString, Infinity)).rejects.toThrow('Invalid salt version');
  });
});
