import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDatabaseConfig, clearDatabaseConfigCache } from '../../../src/auth/src/config/db.js';


describe('Getting database configuration', () => {

  const origEnv = process.env;

  beforeEach(() => {
    clearDatabaseConfigCache();
    process.env = {
      ...origEnv,
      DATABASE_URL: 'file:./dev.db'
    };
  });
  afterEach(() => {
    clearDatabaseConfigCache();
    process.env = origEnv;
  });

  it('Gets database configuration successfully', () => {
    const  result = getDatabaseConfig();
    expect(result).toBe('file:./dev.db');
  });

  it('Throws error if DATABASE_URL is invalid', () => {
    process.env.DATABASE_URL = 'invalid-url';
    expect(() => getDatabaseConfig()).toThrow('Invalid DATABASE_URL: DATABASE_URL must be "file::memory:" or start with "file:" and specify a path');
  });
  
  it('Throws error if DATABASE_URL is empty', () => {
    process.env.DATABASE_URL = '';
    expect(() => getDatabaseConfig()).toThrow('Invalid DATABASE_URL: DATABASE_URL cannot be empty, DATABASE_URL must be "file::memory:" or start with "file:" and specify a path');
  });
  it('Throws error if DATABASE_URL has no path after file:', () => {
    process.env.DATABASE_URL = 'file:';
    expect(() => getDatabaseConfig()).toThrow('Invalid DATABASE_URL: DATABASE_URL must be "file::memory:" or start with "file:" and specify a path');
  });

  it('Caches the database configuration after first retrieval', () => {
    const firstCall = getDatabaseConfig();
    process.env.DATABASE_URL = 'file:./another.db';
    const secondCall = getDatabaseConfig();
    expect(firstCall).toBe(secondCall);
  });

  it('Accepts "file::memory:" as valid DATABASE_URL', () => {
    process.env.DATABASE_URL = 'file::memory:';
    const result = getDatabaseConfig();
    expect(result).toBe('file::memory:');
  });

});
