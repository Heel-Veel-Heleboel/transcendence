import { describe, it, expect, vi } from 'vitest';

describe('Service config parsing', () => {
  it('derives prefix and rewritePrefix when missing and applies defaults', async () => {
    vi.resetModules();
    const { normalizeServiceConfig } = await import('../../../src/api-gateway/src/config/service');

    const raw = { name: 'user-service', upstream: 'http://localhost:9001' };
    const svc = normalizeServiceConfig(raw as any);

    expect(svc.name).toBe('user-service');
    expect(svc.upstream).toBe('http://localhost:9001');
    expect(svc.prefix).toBe('/api/user');
    expect(svc.rewritePrefix).toBe('user');
    expect(svc.timeout).toBe(5000);
    expect(svc.retries).toBe(2);
  });

  it('normalizes provided prefix and uses provided rewritePrefix', async () => {
    const { normalizeServiceConfig } = await import('../../../src/api-gateway/src/config/service');
    const raw = { name: 'user-service', upstream: 'http://localhost:9001', prefix: 'users/', rewritePrefix: 'u' };
    const svc = normalizeServiceConfig(raw as any);
    expect(svc.prefix).toBe('/users');
    expect(svc.rewritePrefix).toBe('u');
  });

  it('parseJsonServiceConfig throws when input is not an array', async () => {
    const { parseJsonServiceConfig } = await import('../../../src/api-gateway/src/config/service');
    expect(() => parseJsonServiceConfig({} as any, 'testsource')).toThrow(/testsource must be a JSON array of services/);
  });

  it('parseJsonServiceConfig aggregates errors and reports indexes', async () => {
    const { parseJsonServiceConfig } = await import('../../../src/api-gateway/src/config/service');
    const input = [
      { name: 'good-service', upstream: 'http://localhost:9001' },
      { name: 'bad-service' } // missing upstream
    ];
    expect(() => parseJsonServiceConfig(input as any, 'testsource')).toThrow(/Invalid services in testsource/);
  });

  it('getServicesConfig reads SERVICES env var and returns normalized services', async () => {
    process.env.SERVICES = JSON.stringify([
      { name: 'user-service', upstream: 'http://localhost:9001' }
    ]);
    vi.resetModules();
    const { getServicesConfig } = await import('../../../src/api-gateway/src/config/service');
    const svcs = getServicesConfig();
    expect(svcs.length).toBe(1);
    expect(svcs[0].prefix).toBe('/api/user');

    delete process.env.SERVICES;
    vi.resetModules();
  });

  it('getServicesConfig throws on duplicate names or prefixes', async () => {
    process.env.SERVICES = JSON.stringify([
      { name: 'user-service', upstream: 'http://localhost:9001' },
      { name: 'user-service', upstream: 'http://localhost:9002' }
    ]);
    vi.resetModules();
    const { getServicesConfig } = await import('../../../src/api-gateway/src/config/service');
    expect(() => getServicesConfig()).toThrow(/Duplicate service configuration detected/);

    // duplicate prefixes
    process.env.SERVICES = JSON.stringify([
      { name: 'a-service', upstream: 'http://1', prefix: '/x' },
      { name: 'b-service', upstream: 'http://2', prefix: '/x' }
    ]);
    vi.resetModules();
    const { getServicesConfig: getServicesConfig2 } = await import('../../../src/api-gateway/src/config/service');
    expect(() => getServicesConfig2()).toThrow(/Duplicate service configuration detected/);

    delete process.env.SERVICES;
    vi.resetModules();
  });

  it('throws when input is not an object', async () => {
    const { normalizeServiceConfig } = await import('../../../src/api-gateway/src/config/service');
    expect(() => normalizeServiceConfig(null as any)).toThrow(/service entry must be an object/);
  });

  it('throws when name is missing', async () => {
    const { normalizeServiceConfig } = await import('../../../src/api-gateway/src/config/service');
    expect(() => normalizeServiceConfig({ upstream: 'http://x' } as any)).toThrow(/service entry missing required "name" field/);
  });

  it('replaces underscores with dashes in name', async () => {
    const { normalizeServiceConfig } = await import('../../../src/api-gateway/src/config/service');
    const svc = normalizeServiceConfig({ name: 'my_service', upstream: 'http://x' } as any);
    expect(svc.name).toBe('my-service');
  });

  it('throws with service name in upstream-missing error', async () => {
    const { normalizeServiceConfig } = await import('../../../src/api-gateway/src/config/service');
    expect(() => normalizeServiceConfig({ name: 'no-up', upstream: '' } as any)).toThrow(/service "no-up" missing required "upstream"/);
  });

  it('coerces requiresAuth and websocket truthy values to true', async () => {
    const { normalizeServiceConfig } = await import('../../../src/api-gateway/src/config/service');
    const raw = { name: 'auth-service', upstream: 'http://x', requiresAuth: 'true', ws: 'true' };
    const svc = normalizeServiceConfig(raw as any);
    expect(svc.requiresAuth).toBe(true);
    expect(svc.websocket).toBe(true);

    const raw2 = { name: 'noauth-service', upstream: 'http://x' };
    const svc2 = normalizeServiceConfig(raw2 as any);
    expect(svc2.requiresAuth).toBe(false);
    expect(svc2.websocket).toBe(false);
  });
});