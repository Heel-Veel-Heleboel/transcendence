import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Rate limit config parsing', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parseRateLimitConfig: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parseJsonRateLimits: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let getRateLimitConfig: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let logger: any;

  beforeEach(async () => {
    vi.resetModules();
    const rateModule = await import('../../../src/api-gateway/src/config/rateLimit');
    parseRateLimitConfig = rateModule.parseRateLimitConfig;
    parseJsonRateLimits = rateModule.parseJsonRateLimits;
    getRateLimitConfig = rateModule.getRateLimitConfig;

    const loggerModule = await import('../../../src/api-gateway/src/config/logger');
    logger = loggerModule.logger;
  });

  afterEach(() => {
    delete process.env.RATE_LIMITS;
    delete process.env.RATE_LIMITS_FILE;
    vi.resetModules();
  });

  it('parses object-shaped endpoints into a map', () => {
    const raw = {
      endpoints: {
        '/health': { max: 50, timeWindow: '1 minute' }
      }
    };

    const cfg = parseRateLimitConfig(raw);
    expect(cfg.endpoints['/health'].max).toBe(50);
  });

  it('returns sensible defaults when input is undefined', () => {
    const cfg = parseRateLimitConfig(undefined);
    expect(cfg.global.max).toBe(1000);
    expect(Object.keys(cfg.endpoints).length).toBe(0);
  });

  it('getRateLimitConfig reads RATE_LIMITS env var', () => {
    process.env.RATE_LIMITS = JSON.stringify({
      global: { max: 1234, timeWindow: '1 minute' },
      endpoints: { '/login': { max: 5, timeWindow: '1 minute' } }
    });

    const cfg = getRateLimitConfig();
    expect(cfg.global.max).toBe(1234);
    expect(cfg.endpoints['/login'].max).toBe(5);
  });

  it('parseJsonRateLimits falls back to defaults and logs info on invalid input', () => {
    const logInfo = vi.spyOn(logger, 'info').mockImplementation(() => {});
    const def = { max: 5, timeWindow: '1 minute' };
    const res = parseJsonRateLimits(null, def, 'test context');
    expect(res).toEqual(def);
    expect(logInfo).toHaveBeenCalled();
    logInfo.mockRestore();
  });

  it('object-shaped endpoints: skips empty key and warns', () => {
    const logWarn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const raw = { endpoints: { '': { max: 10, timeWindow: '1 minute' } } };
    const cfg = parseRateLimitConfig(raw);
    expect(Object.keys(cfg.endpoints).length).toBe(0);
    expect(logWarn).toHaveBeenCalled();
    logWarn.mockRestore();
  });

  it('object-shaped endpoints: invalid value falls back to defaultAuthenticated and logs info', () => {
    const logInfo = vi.spyOn(logger, 'info').mockImplementation(() => {});
    const raw = { endpoints: { '/x': 'invalid' } };
    const cfg = parseRateLimitConfig(raw);
    expect(cfg.endpoints['/x'].max).toBe(2000);
    expect(logInfo).toHaveBeenCalled();
    logInfo.mockRestore();
  });

  it('parseJsonRateLimits uses default max when max is undefined', () => {
    const logInfo = vi.spyOn(logger, 'info').mockImplementation(() => {});
    const def = { max: 777, timeWindow: '1 hour' };
    const raw = { timeWindow: '5 minutes' };
    const res = parseJsonRateLimits(raw, def, 'test context');
    expect(res.max).toBe(777);
    expect(res.timeWindow).toBe('5 minutes');
    expect(logInfo).toHaveBeenCalledWith(
      expect.objectContaining({ max: 777 }),
      'Using default max'
    );
    logInfo.mockRestore();
  });

  it('endpoint parsing error is caught and logged', () => {
    const logWarn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const raw = { endpoints: { '/api/test': { max: -100, timeWindow: '1 minute' } } };
    const cfg = parseRateLimitConfig(raw);
    expect(cfg.endpoints['/api/test']).toBeUndefined();
    expect(logWarn).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/api/test', error: expect.any(String) }),
      'Failed to parse endpoint rate limit'
    );
    logWarn.mockRestore();
  });

  it('getRateLimitConfig reads from RATE_LIMITS_FILE env var', async () => {
    const fs = await import('fs');
    const tempDir = '/tmp';
    const tempFile = `${tempDir}/test-rate-limits.json`;
    const content = JSON.stringify({
      global: { max: 5000, timeWindow: '10 minutes' },
      endpoints: { '/test': { max: 100, timeWindow: '1 minute' } }
    });
    fs.writeFileSync(tempFile, content);

    process.env.RATE_LIMITS_FILE = tempFile;

    const cfg = getRateLimitConfig();
    expect(cfg.global.max).toBe(5000);
    expect(cfg.global.timeWindow).toBe('10 minutes');
    expect(cfg.endpoints['/test'].max).toBe(100);

    fs.unlinkSync(tempFile);
  });

  it('getRateLimitConfig throws when RATE_LIMITS_FILE does not exist', () => {
    process.env.RATE_LIMITS_FILE = '/nonexistent/file.json';

    expect(() => getRateLimitConfig()).toThrow(/does not exist/);
  });
});