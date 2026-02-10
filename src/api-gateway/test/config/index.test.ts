import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe("Configuration loading", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    delete process.env.PORT;
    delete process.env.HOST;
    delete process.env.NODE_ENV;
    delete process.env.SERVICES;
    delete process.env.SERVICES_FILE;
    delete process.env.RATE_LIMITS;
    delete process.env.RATE_LIMITS_FILE;
    delete process.env.JWT_SECRET;
    vi.resetModules();
  });

  it("loads default general configurations", async () => {
    process.env.NODE_ENV = 'development';
    vi.resetModules();
    const { config } = await import('../../src/config/index');
    expect(config.port).toBe(3000);
    expect(config.host).toBe("0.0.0.0");
    expect(config.nodeEnv).toBe("development");
  });

  // Updated: use SERVICES JSON env var instead of individual USER_SERVICE_URL
  it("loads service configurations from environment variables", async () => {
    process.env.SERVICES = JSON.stringify([
      { name: 'user-service', upstream: 'http://localhost:9001' }
    ]);
    vi.resetModules();
    const { config } = await import('../../src/config/index');
    const userService = config.services.find(s => s.name === 'user-service');
    expect(userService?.upstream).toBe('http://localhost:9001');
  });

  it("handles invalid environment variable formats gracefully", async () => {
    process.env.PORT = 'not-a-number';
    vi.resetModules();
    const { logger } = await import('../../src/config/logger');
    const logWarn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const { config } = await import('../../src/config/index');
    expect(config.port).toBe(3000); // Falls back to default
    expect(logWarn).toHaveBeenCalled();
    logWarn.mockRestore();
  });

  it("loads rate limiting configurations correctly", async () => {
    process.env.RATE_LIMITS = JSON.stringify({
      global: { max: 1000, windowMs: 60000 },
      endpoints: { '/api/auth/login': { max: 10, windowMs: 60000 } }
    });
    vi.resetModules();
    const { config } = await import('../../src/config/index');
    expect(config.rateLimits.global.max).toBe(1000);
    expect(config.rateLimits.endpoints['/api/auth/login'].max).toBe(10);
  });
});

describe("validateConfig()", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
    delete process.env.JWT_SECRET;
    vi.resetModules();
  });

  it("throws an error in production if JWT_SECRET is missing", async () => {
    process.env.NODE_ENV = 'production';
    await expect(async () => {
      await import('../../src/config/index');
    }).rejects.toThrow('JWT_SECRET environment variable must be set in production.');
  });

  it("does not throw in development mode", async () => {
    const { validateConfig } = await import('../../src/config/index');
    expect(() => validateConfig()).not.toThrow();
  });
});