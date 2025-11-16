import { describe, it, expect, vi, afterEach } from 'vitest';
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
