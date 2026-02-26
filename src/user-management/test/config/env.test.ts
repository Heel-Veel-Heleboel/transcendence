import { describe, it, expect } from 'vitest';
import { EnvSchema } from '../../src/schemas/env.js';

describe('Environment DATABASE_URL validation', () => {
  const validEnv = { DATABASE_URL: 'file:./test.db', PORT: '3000', HOST: 'localhost', AUTH_URL: 'http://localhost:3000' };

  it('Should accept valid file path', () => {
    const result = EnvSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
  });

  it('Should accept memory database', () => {
    const result = EnvSchema.safeParse({ ...validEnv, DATABASE_URL: 'file::memory:' });
    expect(result.success).toBe(true);
  });

  it('Should reject invalid format', () => {
    const result = EnvSchema.safeParse({ ...validEnv, DATABASE_URL: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('Should reject file path without .db extension', () => {
    const result = EnvSchema.safeParse({ ...validEnv, DATABASE_URL: 'file:./test' });
    expect(result.success).toBe(false);
  });

  it('Should accept file with one character name', () => {
    const result = EnvSchema.safeParse({ ...validEnv, DATABASE_URL: 'file:a.db' });
    expect(result.success).toBe(true);
  });

  it('Should reject file path that is too short', () => {
    const result = EnvSchema.safeParse({ ...validEnv, DATABASE_URL: 'file:.db' });
    expect(result.success).toBe(false);
  });

  it('Should reject missing DATABASE_URL', () => {
    const { DATABASE_URL, ...rest } = validEnv;
    const result = EnvSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('Should reject file path that does not start with file:', () => {
    const result = EnvSchema.safeParse({ ...validEnv, DATABASE_URL: './test.db' });
    expect(result.success).toBe(false);
  });
});

describe('Environment PORT validation', () => {
  const validEnv = { DATABASE_URL: 'file:./test.db', PORT: '3000', HOST: 'localhost', AUTH_URL: 'http://localhost:3000' };

  it('Should accept valid port number', () => {
    const result = EnvSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
  });

  it('Should reject non-numeric port', () => {
    const result = EnvSchema.safeParse({ ...validEnv, PORT: 'abc' });
    expect(result.success).toBe(false);
  });

  it('Should reject port number out of range', () => {
    const result = EnvSchema.safeParse({ ...validEnv, PORT: '70000' });
    expect(result.success).toBe(false);
  });

  it('Should reject missing PORT', () => {
    const { PORT, ...rest } = validEnv;
    const result = EnvSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe('Environment HOST validation', () => {
  const validEnv = { DATABASE_URL: 'file:./test.db', PORT: '3000', HOST: 'localhost', AUTH_URL: 'http://localhost:3000' };

  it('Should accept valid hostname', () => {
    const result = EnvSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
  });

  it('Should accept valid IP address', () => {
    const result = EnvSchema.safeParse({ ...validEnv, HOST: '192.168.1.1' });
    expect(result.success).toBe(true);
  });

  it('Should reject HOST with invalid characters', () => {
    const result = EnvSchema.safeParse({ ...validEnv, HOST: 'host name' });
    expect(result.success).toBe(false);
  });

  it('Should reject missing HOST', () => {
    const { HOST, ...rest } = validEnv;
    const result = EnvSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('Should reject empty HOST', () => {
    const result = EnvSchema.safeParse({ ...validEnv, HOST: '' });
    expect(result.success).toBe(false);
  });
});

describe('Environment AUTH_URL validation', () => {
  const validEnv = { DATABASE_URL: 'file:./test.db', PORT: '3000', HOST: 'localhost', AUTH_URL: 'http://localhost:3000' };

  it('Should accept valid URL', () => {
    const result = EnvSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
  });

  it('Should reject invalid URL', () => {
    const result = EnvSchema.safeParse({ ...validEnv, AUTH_URL: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('Should reject missing AUTH_URL', () => {
    const { AUTH_URL, ...rest } = validEnv;
    const result = EnvSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('Should reject URL that does not start with http', () => {
    const result = EnvSchema.safeParse({ ...validEnv, AUTH_URL: 'ftp://localhost:3000' });
    expect(result.success).toBe(false);
  });

  it('Should reject empty AUTH_URL', () => {
    const result = EnvSchema.safeParse({ ...validEnv, AUTH_URL: '' });
    expect(result.success).toBe(false);
  });
});