import { describe, it, expect, vi, afterEach } from 'vitest';
import { normalizeService, parseJsonServicesInput } from '../../../src/api-gateway/src/config/service';
import fs from 'fs';
import os from 'os';
import path from 'path';

const tmpFiles: string[] = [];

afterEach(() => {
  vi.resetModules();
  delete process.env.SERVICES;
  delete process.env.SERVICES_FILE;
  // cleanup any temp files created
  while (tmpFiles.length) {
    const p = tmpFiles.pop()!;
    try {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch (_) {}
  }
});

describe('Service configuration parsing', () => {
  it('parses services from SERVICES env JSON', async () => {
    process.env.SERVICES = JSON.stringify([
      { name: 'user-service', upstream: 'http://localhost:9001' }
    ]);

    vi.resetModules();
    const { parseServicesFromEnv } = await import('../../../src/api-gateway/src/config/service');
    const svcs = parseServicesFromEnv();

    expect(Array.isArray(svcs)).toBe(true);
    expect(svcs.length).toBe(1);
    expect(svcs[0].name).toBe('user-service');
    expect(svcs[0].upstream).toBe('http://localhost:9001');
  });

  it('parses services from SERVICES_FILE (file-first)', async () => {
    const tmp = path.join(os.tmpdir(), `test_services_${Date.now()}.json`);
    const payload = [{ name: 'game-service', upstream: 'http://localhost:9002' }];
    fs.writeFileSync(tmp, JSON.stringify(payload), 'utf8');
    tmpFiles.push(tmp);

    process.env.SERVICES_FILE = tmp;
    vi.resetModules();
    const { parseServicesFromEnv } = await import('../../../src/api-gateway/src/config/service');
    const svcs = parseServicesFromEnv();

    expect(svcs.length).toBe(1);
    expect(svcs[0].name).toBe('game-service');
    expect(svcs[0].upstream).toBe('http://localhost:9002');
  });

  it('skips invalid service entries and accepts valid ones (partial acceptance)', async () => {
    process.env.SERVICES = JSON.stringify([
      { name: 'valid-service', upstream: 'http://good' },
      { name: 'invalid-service' }
    ]);
    vi.resetModules();
    const { parseServicesFromEnv } = await import('../../../src/api-gateway/src/config/service');
    const svcs = parseServicesFromEnv();

    expect(svcs.length).toBe(1);
    expect(svcs[0].name).toBe('valid-service');
  });

  it('returns empty array on invalid SERVICES JSON (fail-open)', async () => {
    process.env.SERVICES = '{ bad json';
    vi.resetModules();
    const { parseServicesFromEnv } = await import('../../../src/api-gateway/src/config/service');
    const svcs = parseServicesFromEnv();
    expect(Array.isArray(svcs)).toBe(true);
    expect(svcs.length).toBe(0);
  });

  it('getServicesConfig falls back to defaults when no env/file provided', async () => {
    vi.resetModules();
    const { getServicesConfig, getDefaultServices } = await import('../../../src/api-gateway/src/config/service');
    const cfg = getServicesConfig();
    const defaults = getDefaultServices();
    expect(Array.isArray(cfg)).toBe(true);
    expect(cfg.length).toBeGreaterThan(0);
    // ensure default user-service exists
    const user = cfg.find(s => s.name === 'user-service');
    expect(user).toBeDefined();
    expect(cfg).toEqual(defaults);
  });
});

describe('additional normalizeService branches', () => {
  it('computes default prefix and rewritePrefix when not provided', () => {
    const raw = { name: 'user-service', upstream: 'http://u' };
    const svc = normalizeService(raw as any)!;
    expect(svc.prefix).toBe('/api/user');
    expect(svc.rewritePrefix).toBe('user');
  });

  it('returns object even when zod validation fails (continues on parse error)', () => {
    const raw = {
      name: 'weird-service',
      upstream: 'http://weird',
      timeout: 'not-a-number',
      requiresAuthRoles: { foo: 'bar' }
    };
    const svc = normalizeService(raw as any)!;
    expect(svc).toBeDefined();
    expect(svc.name).toBe('weird-service');
    expect(svc.upstream).toBe('http://weird');
    // timeout will be coerced (Number('not-a-number') -> NaN) but still present as property
    expect(Object.prototype.hasOwnProperty.call(svc, 'timeout')).toBe(true);
  });

  it('coerces requiresAuth from string "true" and leaves undefined for falsey', () => {
    const svcTrue = normalizeService({ name: 'a', upstream: 'http://a', requiresAuth: 'true' } as any)!;
    expect(svcTrue.requiresAuth).toBe(true);

    const svcFalse = normalizeService({ name: 'b', upstream: 'http://b', requiresAuth: false } as any)!;
    expect(svcFalse.requiresAuth).toBeUndefined();
  });

  it('accepts requiresAuthRoles as array of strings', () => {
    const raw = { name: 'rsvc', upstream: 'http://r', requiresAuthRoles: ['one', 'two'] };
    const svc = normalizeService(raw as any)!;
    expect(svc.requiresAuthRoles).toEqual(['one', 'two']);
  });
});

describe('edge cases for parseServicesFromEnv and normalizeService', () => {
  it('returns empty when SERVICES_FILE points to non-existent file', async () => {
    process.env.SERVICES_FILE = '/path/does/not/exist.json';
    vi.resetModules();
    const { parseServicesFromEnv } = await import('../../../src/api-gateway/src/config/service');
    const res = parseServicesFromEnv();
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(0);
    delete process.env.SERVICES_FILE;
  });

  it('returns empty on invalid SERVICES JSON', async () => {
    process.env.SERVICES = '{ bad json';
    vi.resetModules();
    const { parseServicesFromEnv } = await import('../../../src/api-gateway/src/config/service');
    const res = parseServicesFromEnv();
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(0);
    delete process.env.SERVICES;
  });

  it('returns empty when SERVICES_FILE contains an empty array', async () => {
    const tmp = path.join(os.tmpdir(), `test_services_empty_${Date.now()}.json`);
    fs.writeFileSync(tmp, JSON.stringify([]), 'utf8');
    tmpFiles.push(tmp);

    process.env.SERVICES_FILE = tmp;
    vi.resetModules();
    const { parseServicesFromEnv } = await import('../../../src/api-gateway/src/config/service');
    const res = parseServicesFromEnv();
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(0);

    delete process.env.SERVICES_FILE;
  });

  it("honors 'service' alias for name and 'url' alias for upstream", () => {
    const raw = { service: 'svc-alias', url: 'http://alias:9000' };
    const svc = normalizeService(raw as any)!;
    expect(svc.name).toBe('svc-alias');
    expect(svc.upstream).toBe('http://alias:9000');
  });

  it('derives rewritePrefix from raw.prefix when provided', () => {
    const raw = { name: 'x-service', upstream: 'http://x', prefix: '/api/custompath' };
    const svc = normalizeService(raw as any)!;
    expect(svc.rewritePrefix).toBe('custompath');
  });

  it('splits requiresAuthRoles when provided as comma-separated string', () => {
    const raw = { name: 'rr', upstream: 'http://r', requiresAuthRoles: 'one,two, three' };
    const svc = normalizeService(raw as any)!;
    expect(svc.requiresAuthRoles).toEqual(['one', 'two', 'three']);
  });
});