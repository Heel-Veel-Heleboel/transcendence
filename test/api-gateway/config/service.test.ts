import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Service config parsing', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let normalizeServiceConfig: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parseJsonServiceConfig: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let getServicesConfig: any;

  beforeEach(async () => {
    vi.resetModules();
    const module = await import('../../../src/api-gateway/src/config/service');
    normalizeServiceConfig = module.normalizeServiceConfig;
    parseJsonServiceConfig = module.parseJsonServiceConfig;
    getServicesConfig = module.getServicesConfig;
  });

  afterEach(() => {
    delete process.env.SERVICES;
    delete process.env.SERVICES_FILE;
    vi.resetModules();
  });

  it('derives prefix and rewritePrefix when missing and applies defaults', async () => {

    const raw = { name: 'user-service', upstream: 'http://localhost:9001' };
    const svc = normalizeServiceConfig(raw);

    expect(svc.name).toBe('user-service');
    expect(svc.upstream).toBe('http://localhost:9001');
    expect(svc.prefix).toBe('/api/user');
    expect(svc.rewritePrefix).toBe('user');
    expect(svc.timeout).toBe(5000);
    expect(svc.retries).toBe(2);
  });

  it('normalizes provided prefix and uses provided rewritePrefix', async () => {
    const raw = { name: 'user-service', upstream: 'http://localhost:9001', prefix: 'users/', rewritePrefix: 'u' };
    const svc = normalizeServiceConfig(raw);
    expect(svc.prefix).toBe('/users');
    expect(svc.rewritePrefix).toBe('u');
  });

  it('parseJsonServiceConfig throws when input is not an array', () => {
    expect(() => parseJsonServiceConfig({}, 'testsource')).toThrow(/testsource must be a JSON array of services/);
  });

  it('parseJsonServiceConfig aggregates errors and reports indexes', () => {
    const input = [
      { name: 'good-service', upstream: 'http://localhost:9001' },
      { name: 'bad-service' }
    ];
    expect(() => parseJsonServiceConfig(input, 'testsource')).toThrow(/Invalid services in testsource/);
  });

  it('getServicesConfig reads SERVICES env var and returns normalized services', () => {
    process.env.SERVICES = JSON.stringify([
      { name: 'user-service', upstream: 'http://localhost:9001' }
    ]);

    const svcs = getServicesConfig();
    expect(svcs.length).toBe(1);
    expect(svcs[0].prefix).toBe('/api/user');
  });

  it('getServicesConfig throws on duplicate names or prefixes', () => {
    process.env.SERVICES = JSON.stringify([
      { name: 'user-service', upstream: 'http://localhost:9001' },
      { name: 'user-service', upstream: 'http://localhost:9002' }
    ]);

    expect(() => getServicesConfig()).toThrow(/Duplicate service configuration detected/);

    // duplicate prefixes
    process.env.SERVICES = JSON.stringify([
      { name: 'a-service', upstream: 'http://1', prefix: '/x' },
      { name: 'b-service', upstream: 'http://2', prefix: '/x' }
    ]);

    expect(() => getServicesConfig()).toThrow(/Duplicate service configuration detected/);
  });

  it('throws when input is not an object', () => {
    expect(() => normalizeServiceConfig(null)).toThrow(/service entry must be an object/);
  });

  it('throws when name is missing', () => {
    expect(() => normalizeServiceConfig({ upstream: 'http://x' })).toThrow(/service entry missing required "name" field/);
  });

  it('replaces underscores with dashes in name', () => {
    const svc = normalizeServiceConfig({ name: 'my_service', upstream: 'http://x' });
    expect(svc.name).toBe('my-service');
  });

  it('throws with service name in upstream-missing error', () => {
    expect(() => normalizeServiceConfig({ name: 'no-up', upstream: '' })).toThrow(/service "no-up" missing required "upstream"/);
  });

  it('coerces requiresAuth and websocket truthy values to true', () => {
    const raw = { name: 'auth-service', upstream: 'http://x', requiresAuth: 'true', ws: 'true' };
    const svc = normalizeServiceConfig(raw);
    expect(svc.requiresAuth).toBe(true);
    expect(svc.websocket).toBe(true);

    const raw2 = { name: 'noauth-service', upstream: 'http://x' };
    const svc2 = normalizeServiceConfig(raw2);
    expect(svc2.requiresAuth).toBe(false);
    expect(svc2.websocket).toBe(false);
  });
});