import { describe, it, expect, vi } from 'vitest';

describe('Rate limit config parsing', () => {
  it('parses array-shaped endpoints into a map', async () => {
    const { parseRateLimitConfig } = await import('../../../src/api-gateway/src/config/rateLimit');

    const raw = {
      global: { max: 1000, timeWindow: '1 minute' },
      authenticated: { max: 2000, timeWindow: '1 minute' },
      endpoints: [
        { path: '/api/auth/login', limit: { max: 10, timeWindow: '1 minute' } }
      ]
    };

    const cfg = parseRateLimitConfig(raw);
    expect(cfg.global.max).toBe(1000);
    expect(cfg.endpoints['/api/auth/login'].max).toBe(10);
  });

  it('parses object-shaped endpoints into a map', async () => {
    const { parseRateLimitConfig } = await import('../../../src/api-gateway/src/config/rateLimit');

    const raw = {
      endpoints: {
        '/health': { max: 50, timeWindow: '1 minute' }
      }
    };

    const cfg = parseRateLimitConfig(raw);
    expect(cfg.endpoints['/health'].max).toBe(50);
  });

  it('returns sensible defaults when input is undefined', async () => {
    const { parseRateLimitConfig } = await import('../../../src/api-gateway/src/config/rateLimit');
    const cfg = parseRateLimitConfig(undefined);
    expect(cfg.global.max).toBe(1000);
    expect(Object.keys(cfg.endpoints).length).toBe(0);
  });

  it('parseJsonEndpointRateLimits throws when path missing', () => {
    // dynamic import to match other tests
    return (async () => {
      const { parseJsonEndpointRateLimits } = await import('../../../src/api-gateway/src/config/rateLimit');
      const defaultEntry = { max: 2000, timeWindow: '1 minute' };
      expect(() => parseJsonEndpointRateLimits({ limit: { max: 1 } }, defaultEntry)).toThrow();
    })();
  });

  it('getRateLimitConfig reads RATE_LIMITS env var', async () => {
    vi.resetModules();
    process.env.RATE_LIMITS = JSON.stringify({
      global: { max: 1234, timeWindow: '1 minute' },
      endpoints: { '/login': { max: 5, timeWindow: '1 minute' } }
    });

    const { getRateLimitConfig } = await import('../../../src/api-gateway/src/config/rateLimit');
    const cfg = getRateLimitConfig();
    expect(cfg.global.max).toBe(1234);
    expect(cfg.endpoints['/login'].max).toBe(5);

    delete process.env.RATE_LIMITS;
    vi.resetModules();
  });

  it('parseJsonRateLimits falls back to defaults and warns on invalid input', async () => {
    const { parseJsonRateLimits } = await import('../../../src/api-gateway/src/config/rateLimit');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const def = { max: 5, timeWindow: '1 minute' };
    const res = parseJsonRateLimits('not-an-object' as any, def);
    expect(res).toEqual(def);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('parseJsonEndpointRateLimits throws when raw is not an object', async () => {
    const { parseJsonEndpointRateLimits } = await import('../../../src/api-gateway/src/config/rateLimit');
    const defaultEntry = { max: 2000, timeWindow: '1 minute' };
    expect(() => parseJsonEndpointRateLimits(null as any, defaultEntry)).toThrow(/must be an object/);
  });

  it('object-shaped endpoints: skips empty key and warns', async () => {
    vi.resetModules();
    const { parseRateLimitConfig } = await import('../../../src/api-gateway/src/config/rateLimit');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const raw = { endpoints: { '': { max: 10, timeWindow: '1 minute' } } };
    const cfg = parseRateLimitConfig(raw as any);
    expect(Object.keys(cfg.endpoints).length).toBe(0);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('object-shaped endpoints: invalid value falls back to defaultAuthenticated and warns', async () => {
    vi.resetModules();
    const { parseRateLimitConfig } = await import('../../../src/api-gateway/src/config/rateLimit');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const raw = { endpoints: { '/x': 'invalid' } };
    const cfg = parseRateLimitConfig(raw as any);
    // defaultAuthenticated max is 2000
    expect(cfg.endpoints['/x'].max).toBe(2000);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});