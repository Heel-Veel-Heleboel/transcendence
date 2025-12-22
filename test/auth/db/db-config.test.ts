import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDataBaseConfig, clearDatabaseConfigCache } from '../../../src/auth/src/config/db.js';


describe ('Getting database configuration', () => {

  const origEnv = process.env;

  beforeEach(() => {
    clearDatabaseConfigCache();
    process.env  = {
      ...origEnv,
      DATABASE_URL: 'file:./dev.db'
    };
  });
  afterEach(() => {
    clearDatabaseConfigCache();
    process.env = origEnv;
  });

  it ('Gets database configuration successfully', () => {
    const  result = getDataBaseConfig();
    expect(result).toBe('file:./dev.db');
  });

  it ('Throws error if DATABASE_URL is invalid', () => {
    process.env.DATABASE_URL = 'invalid-url';
    expect(() => getDataBaseConfig()).toThrow('Invalid DATABASE_URL: DATABASE_URL must start with "file:"');
  });
  
  it ('Throws error if DATABASE_URL is empty', () => {
    process.env.DATABASE_URL = '';
    expect(() => getDataBaseConfig()).toThrow('Invalid DATABASE_URL: DATABASE_URL cannot be empty, DATABASE_URL must start with "file:"');
  });
  it ('Throws error if DATABASE_URL has no path after file:', () => {
    process.env.DATABASE_URL = 'file:';
    expect(() => getDataBaseConfig()).toThrow('Invalid DATABASE_URL: DATABASE_URL must specify a path after "file:"');
  });

  it ('Caches the database configuration after first retrieval', () => {
    const firstCall = getDataBaseConfig();
    process.env.DATABASE_URL = 'file:./another.db';
    const secondCall = getDataBaseConfig();
    expect(firstCall).toBe(secondCall);
  });
});