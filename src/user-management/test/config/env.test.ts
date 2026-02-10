import { describe, it, expect } from 'vitest';
import { EnvSchema } from '../../src/schemas/env.js';

describe('Environment DATABASE_URL validation', () => {
  it('Should accept valid file path', () => {
    const result = EnvSchema.safeParse({ DATABASE_URL: 'file:./test.db' });
    expect(result.success).toBe(true);
  });

  it('Should accept memory database', () => {
    const result = EnvSchema.safeParse({ DATABASE_URL: 'file::memory:' });
    expect(result.success).toBe(true);
  });

  it('Should reject invalid format', () => {
    const result = EnvSchema.safeParse({ DATABASE_URL: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('Should reject file path without .db extension', () => {
    const result = EnvSchema.safeParse({ DATABASE_URL: 'file:./test' });
    expect(result.success).toBe(false);
  });

  it('Should reject file path that is too short', () => {
    const result = EnvSchema.safeParse({ DATABASE_URL: 'file:.db' });
    expect(result.success).toBe(false);
  });

  it('Should reject missing DATABASE_URL', () => {
    const result = EnvSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('Should reject file path that does not start with file:', () => {
    const result = EnvSchema.safeParse({ DATABASE_URL: './test.db' });
    expect(result.success).toBe(false);
  });
});