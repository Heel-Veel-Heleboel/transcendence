import { describe, it, expect, vi } from 'vitest';

describe("Configuration loading", () => {
  it("loads default general configurations", async () => {
    delete process.env.NODE_ENV;
    const { config } = await import('../../../src/api-gateway/src/config/index');
    expect(config.port).toBe(3000);
    expect(config.host).toBe("0.0.0.0");
    expect(config.nodeEnv).toBe("development");
  });

  it("loads service configurations from environment variables", async () => {
    process.env.USER_SERVICE_URL = 'http://localhost:9001';
    vi.resetModules();
    const { config } = await import('../../../src/api-gateway/src/config/index');
    const userService = config.services.find(s => s.name === 'user-service');
    expect(userService?.upstream).toBe('http://localhost:9001');
  });

  it("handles invalid environment variable formats gracefully", async () => {
    process.env.PORT = 'not-a-number';
    vi.resetModules();
    const { config } = await import('../../../src/api-gateway/src/config/index');
    expect(config.port).toBeNaN();
  });

  it("loads rate limiting configurations correctly", async () => {
    const { config } = await import('../../../src/api-gateway/src/config/index');
    expect(config.rateLimits.global.max).toBe(1000);
    expect(config.rateLimits.endpoints['/api/auth/login'].max).toBe(10);
  });
});

describe("validateConfig()", () => {
  it("throws an error in production if JWT_SECRET is missing", async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    await expect(async () => {
      await import('../../../src/api-gateway/src/config/index');
    }).rejects.toThrow('JWT_SECRET environment variable must be set in production.');
  });

  it("does not throw in development mode", async () => {
    process.env.NODE_ENV = 'development';
    vi.resetModules();
    const { validateConfig } = await import('../../../src/api-gateway/src/config/index');
    expect(() => validateConfig()).not.toThrow();
  });
});
