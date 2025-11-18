import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { parseJsonRateLimitsInput } from '../../../src/api-gateway/src/config/rateLimit';
import fs from 'fs';
import os from 'os';
import path from 'path';

const RATE_LIMITS_KEY = 'RATE_LIMITS';
const GLOBAL_MAX = 'RATE_LIMIT_GLOBAL_MAX';
const ENDPOINT_USERS_MAX = 'RATE_LIMIT_ENDPOINT_API_USERS_MAX';
const ENDPOINT_USERS_WINDOW = 'RATE_LIMIT_ENDPOINT_API_USERS_WINDOW';

beforeEach(() => {
  vi.resetModules();
  delete process.env[RATE_LIMITS_KEY];
  delete process.env[GLOBAL_MAX];
  delete process.env[ENDPOINT_USERS_MAX];
  delete process.env[ENDPOINT_USERS_WINDOW];
});

afterEach(() => {
  delete process.env[RATE_LIMITS_KEY];
  delete process.env[GLOBAL_MAX];
  delete process.env[ENDPOINT_USERS_MAX];
  delete process.env[ENDPOINT_USERS_WINDOW];
});

describe('getRateLimitConfig', () => {
  it('parses valid RATE_LIMITS JSON (zod success path)', async () => {
    process.env[RATE_LIMITS_KEY] = JSON.stringify({
      global: { max: 1500, timeWindow: '2 minutes' },
      authenticated: { max: 3000, timeWindow: '1 minute' },
      endpoints: {
        '/api/users': { max: 250, timeWindow: '1 minute' },
        '/api/games': { max: 600, timeWindow: '30 seconds' }
      }
    });

    // import after env set (dynamic import to support TS modules)
    const mod = await import('../../../src/api-gateway/src/config/rateLimit');
    const { getRateLimitConfig } = mod;
    const cfg = getRateLimitConfig();

    expect(cfg.global?.max).toBe(1500);
    expect(cfg.global?.timeWindow).toBe('2 minutes');
    expect(cfg.authenticated?.max).toBe(3000);
    expect(cfg.endpoints['/api/users'].max).toBe(250);
    expect(cfg.endpoints['/api/games'].timeWindow).toBe('30 seconds');
  });

  it('coerces string numbers and uses defaults for missing fields (coercion path)', async () => {
    // invalid with strings for numbers -> should be coerced
    process.env[RATE_LIMITS_KEY] = JSON.stringify({
      global: { max: '1800', timeWindow: '1 minute' },
      endpoints: {
        '/api/users': { max: '275', timeWindow: '2 minutes' }
      }
    });

    const mod = await import('../../../src/api-gateway/src/config/rateLimit');
    const { getRateLimitConfig } = mod;
    const cfg = getRateLimitConfig();

    expect(cfg.global?.max).toBe(1800);
    expect(cfg.endpoints['/api/users'].max).toBe(275);
    // other default endpoints should still exist
    expect(cfg.endpoints['/api/auth/login']).toBeDefined();
  });

  it('handles endpoints as non-object and falls back to defaults', async () => {
    process.env[RATE_LIMITS_KEY] = JSON.stringify({
      // endpoints intentionally set to a primitive to hit the "not object" branch
      endpoints: 'not-an-object'
    });

    const mod = await import('../../../src/api-gateway/src/config/rateLimit');
    const { getRateLimitConfig } = mod;
    const cfg = getRateLimitConfig();

    // default endpoints must be present
    expect(cfg.endpoints['/api/auth/login']).toBeDefined();
    expect(cfg.endpoints['/api/users']).toBeDefined();
    expect(cfg.endpoints['/api/games']).toBeDefined();
  });

  it('falls back to individual env vars when RATE_LIMITS JSON is malformed', async () => {
    // malformed JSON
    process.env[RATE_LIMITS_KEY] = '{ this is : not json';
    // set individual env var fallbacks
    process.env[GLOBAL_MAX] = '2222';
    process.env[ENDPOINT_USERS_MAX] = '123';
    process.env[ENDPOINT_USERS_WINDOW] = '30 seconds';

    const mod = await import('../../../src/api-gateway/src/config/rateLimit');
    const { getRateLimitConfig } = mod;
    const cfg = getRateLimitConfig();

    expect(cfg.global?.max).toBe(2222);
    expect(cfg.endpoints['/api/users'].max).toBe(123);
    expect(cfg.endpoints['/api/users'].timeWindow).toBe('30 seconds');
  });

  it('loads RATE_LIMITS from RATE_LIMITS_FILE when present', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rate-limits-'));
    const filePath = path.join(tmpDir, 'limits.json');
    const payload = {
      global: { max: 9999, timeWindow: '5 minutes' },
      endpoints: {
        '/api/users': { max: 11, timeWindow: '10 seconds' }
      }
    };
    fs.writeFileSync(filePath, JSON.stringify(payload), 'utf8');
    process.env['RATE_LIMITS_FILE'] = filePath;

    vi.resetModules();
    const mod = await import('../../../src/api-gateway/src/config/rateLimit');
    const { getRateLimitConfig } = mod;
    const cfg = getRateLimitConfig();

    expect(cfg.global?.max).toBe(9999);
    expect(cfg.endpoints['/api/users'].max).toBe(11);

    // cleanup
    delete process.env['RATE_LIMITS_FILE'];
    try { fs.unlinkSync(filePath); fs.rmdirSync(tmpDir); } catch (_) {}
  });

  it('falls back when RATE_LIMITS JSON is not an object (primitive)', async () => {
    process.env[RATE_LIMITS_KEY] = JSON.stringify('just-a-string');
    vi.resetModules();
    const mod = await import('../../../src/api-gateway/src/config/rateLimit');
    const { getRateLimitConfig } = mod;
    const cfg = getRateLimitConfig();

    // should fall back to defaults
    expect(cfg.global?.max).toBe(1000);
    expect(cfg.endpoints['/api/auth/login']).toBeDefined();
  });

  it('skips invalid endpoint entries during coercion (null value)', async () => {
    process.env[RATE_LIMITS_KEY] = JSON.stringify({ endpoints: { '/bad': null, '/api/users': { max: '40' } } });
    vi.resetModules();
    const mod = await import('../../../src/api-gateway/src/config/rateLimit');
    const { getRateLimitConfig } = mod;
    const cfg = getRateLimitConfig();

    // '/bad' should have been skipped and not present on endpoints
    expect(cfg.endpoints['/bad']).toBeUndefined();
    // '/api/users' should be coerced to number
    expect(cfg.endpoints['/api/users'].max).toBe(40);
  });

  it('parseJsonRateLimitsInput coercion path returns merged defaults and coerced endpoints', () => {
    const input = {
      global: { max: '700', timeWindow: '1 minute' },
      authenticated: { max: '1200', timeWindow: '2 minutes' },
      endpoints: {
        '/api/users': { max: '55', timeWindow: '15 seconds' },
        '/bad': { max: 'not-a-number', timeWindow: null }
      }
    } as any;

    const result = parseJsonRateLimitsInput(input, 'test-source');
    expect(result).not.toBeNull();
    expect(result?.global?.max).toBe(700);
    expect(result?.authenticated?.max).toBe(1200);
    expect(result?.endpoints['/api/users'].max).toBe(55);
    // '/bad' should default to 100 because max was NaN
    expect(result?.endpoints['/bad'].max).toBe(100);
  });

  it('parseJsonRateLimitsInput returns null for primitive input', () => {
    const result = parseJsonRateLimitsInput('not-an-object', 'test-source');
    expect(result).toBeNull();
  });

  it('parseJsonRateLimitsInput handles schema failure and logs warning', () => {
    const input = { global: { max: 'x' } } as any;
    const result = parseJsonRateLimitsInput(input, 'test-source');
    expect(result).not.toBeNull();
    // defaults should be present
    expect(result?.global?.max).toBeGreaterThan(0);
  });
});
