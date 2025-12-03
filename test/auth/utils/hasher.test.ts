import { hasher, compareHash } from '../../../src/auth/src/utils/hasher';
import { describe, it, expect } from 'vitest';

describe('Hasher utility', () => {
  const testString = 'TestPassword123!';
  
  it('hashes a string successfully', async () => {
    const hash = await hasher(testString);
    expect(hash).toBeDefined();
    expect(hash).not.toBe(testString);
  });

  it('compares a string to its hash successfully', async () => {
    const hash = await hasher(testString);
    const isMatch = await compareHash(testString, hash);
    expect(isMatch).toBe(true);
  });

  it('fails comparison for a different string', async () => {
    const hash = await hasher(testString);
    const isMatch = await compareHash('DifferentPassword!', hash);
    expect(isMatch).toBe(false);
  });
});