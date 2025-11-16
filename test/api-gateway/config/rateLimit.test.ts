import { describe, it, expect, vi, afterEach } from 'vitest';

describe('Rate limit configuration', () => {
  afterEach(() => {
    vi.resetModules();
    delete process.env.RATE_LIMITS;
    delete process.env.RATE_LIMITS_FILE;
  });

  it('loads defaults when no env set', async () => {
    const { getRateLimitConfig } = await import('../../../src/api-gateway/src/config/rateLimit');
    const cfg = getRateLimitConfig();
    expect(cfg.global.max).toBe(1000);
    expect(cfg.endpoints['/api/auth/login'].max).toBe(10);
  });

  it('parses RATE_LIMITS env JSON', async () => {
    process.env.RATE_LIMITS = JSON.stringify({
      global: { max: 50, timeWindow: '1 minute' },
      authenticated: { max: 100, timeWindow: '1 minute' },
      endpoints: { '/api/auth/login': { max: 5, timeWindow: '1 minute' } }
    });
    vi.resetModules();
    const { getRateLimitConfig } = await import('../../../src/api-gateway/src/config/rateLimit');
    const cfg = getRateLimitConfig();
    expect(cfg.global.max).toBe(50);
    expect(cfg.endpoints['/api/auth/login'].max).toBe(5);
  });

  it('falls back to defaults on invalid RATE_LIMITS JSON', async () => {
    process.env.RATE_LIMITS = '{ invalid json';
    vi.resetModules();
    const { getRateLimitConfig } = await import('../../../src/api-gateway/src/config/rateLimit');
    const cfg = getRateLimitConfig();
    expect(cfg.global.max).toBe(1000);
  });
});
