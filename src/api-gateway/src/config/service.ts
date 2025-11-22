import fs from 'fs';
import { ServiceConfig } from '../entity/common';

const DEFAULT_TIMEOUT = 5000;
const DEFAULT_RETRIES = 2;

function coerceString(v: any) {
  if (v === undefined || v === null) return '';
  return String(v);
}

export function normalizeServiceConfig(raw: any): ServiceConfig {
  if (!raw || typeof raw !== 'object') {
    throw new Error('service entry must be an object');
  }

  const nameRaw = coerceString(raw.name || raw.service);
  if (!nameRaw) {
    throw new Error('service entry missing required "name" field');
  }
  const name = nameRaw.replace(/_/g, '-');

  const upstream = coerceString(raw.upstream || raw.url);
  if (!upstream) {
    throw new Error(
      `service "${name || 'unknown'}" missing required "upstream"/url`
    );
  }

  // prefix may be omitted — derive from service name when missing
  function normalizePrefix(p: string) {
    let v = coerceString(p);
    if (!v.startsWith('/')) v = '/' + v;
    if (v.length > 1 && v.endsWith('/')) v = v.slice(0, -1);
    return v;
  }

  let prefix: string;
  if (
    raw.prefix !== undefined &&
    raw.prefix !== null &&
    String(raw.prefix).trim() !== ''
  ) {
    prefix = normalizePrefix(raw.prefix);
  } else {
    // derive default prefix from name, e.g. 'user-service' -> '/api/user'
    const base = name.replace(/-service$/, '');
    prefix = normalizePrefix(`/api/${base}`);
    console.info(
      `service "${name}" did not provide prefix; derived prefix="${prefix}"`
    );
  }

  let rewritePrefix: string;
  if (raw.rewritePrefix !== undefined || raw.rewrite !== undefined) {
    rewritePrefix = coerceString(raw.rewritePrefix ?? raw.rewrite);
  } else {
    // derive from normalized prefix by stripping leading '/api/' or leading '/'
    rewritePrefix = prefix.replace(/^\/api\//, '').replace(/^\//, '');
    if (!rewritePrefix) rewritePrefix = name.replace(/-service$/, '');
    console.warn(
      `service "${name}" did not provide rewritePrefix; derived rewritePrefix="${rewritePrefix}"`
    );
  }

  let timeout: number;
  if (raw.timeout !== undefined) {
    timeout = Number(raw.timeout);
  } else {
    timeout = DEFAULT_TIMEOUT;
    console.info(
      `service "${name}" missing timeout; using default ${DEFAULT_TIMEOUT}ms`
    );
  }

  let retries: number;
  if (raw.retries !== undefined) {
    retries = Number(raw.retries);
  } else {
    retries = DEFAULT_RETRIES;
    console.info(
      `service "${name}" missing retries; using default ${DEFAULT_RETRIES}`
    );
  }

  const requiresAuth = raw.requiresAuth ?? raw.auth ?? false;
  const websocket = raw.websocket ?? raw.ws ?? false;

  const svc: ServiceConfig = {
    name,
    upstream,
    prefix,
    rewritePrefix,
    timeout: Number(timeout),
    retries: Number(retries),
    requiresAuth:
      requiresAuth === true || String(requiresAuth) === 'true'
        ? true
        : undefined,
    websocket:
      websocket === true || String(websocket) === 'true' ? true : undefined
  } as ServiceConfig;
  return svc;
}

export function parseJsonServiceConfig(
  input: any,
  source: string
): ServiceConfig[] {
  if (!input) return [];
  if (!Array.isArray(input)) {
    throw new Error(`${source} must be a JSON array of services`);
  }

  const out: ServiceConfig[] = [];
  const errors: string[] = [];

  input.forEach((raw: any, idx: number) => {
    try {
      const s = normalizeServiceConfig(raw);
      out.push(s);
    } catch (e: any) {
      errors.push(`index ${idx}: ${e?.message ?? String(e)}`);
    }
  });

  if (errors.length > 0) {
    throw new Error(`Invalid services in ${source}: ${errors.join('; ')}`);
  }

  return out;
}

/**
 * Locate and parse services config. Precedence: CLI/file env -> SERVICES env var -> []
 * Strict: any invalid config will throw and stop startup here.
 */
export function getServicesConfig(): ServiceConfig[] {
  // 1) SERVICES_FILE env var if set
  const servicesFile = process.env.SERVICES_FILE;
  let services: ServiceConfig[] = [];
  if (servicesFile) {
    if (!fs.existsSync(servicesFile)) {
      throw new Error(
        `SERVICES_FILE is set but file does not exist: ${servicesFile}`
      );
    }
    const raw = fs.readFileSync(servicesFile, 'utf8');
    const parsed = JSON.parse(raw);
    services = parseJsonServiceConfig(parsed, `SERVICES_FILE(${servicesFile})`);
  } else if (process.env.SERVICES) {
    const parsed = JSON.parse(process.env.SERVICES);
    services = parseJsonServiceConfig(parsed, 'SERVICES env var');
  }

  // If no services provided, return empty list
  if (!services || services.length === 0) return [];

  // Post-normalization checks: ensure no duplicate names or prefixes
  const nameSet = new Set<string>();
  const prefixSet = new Set<string>();
  const duplicates: string[] = [];

  for (const s of services) {
    if (nameSet.has(s.name)) duplicates.push(`name:${s.name}`);
    nameSet.add(s.name);
    const p = s.prefix;
    if (prefixSet.has(p)) duplicates.push(`prefix:${p}`);
    prefixSet.add(p);
  }

  if (duplicates.length > 0) {
    throw new Error(
      `Duplicate service configuration detected: ${duplicates.join(', ')}`
    );
  }

  return services;
}
