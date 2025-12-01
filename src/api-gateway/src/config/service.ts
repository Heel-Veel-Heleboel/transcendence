import fs from 'fs';
import { ServiceConfig } from '../entity/common';
import { logger } from '../utils/logger';
import {
  validatePositiveInteger,
  validateNonNegativeInteger,
  validateUrl,
  normalizeBoolean,
  parseJsonSafe
} from '../utils/validation';

const DEFAULT_TIMEOUT = 5000;
const DEFAULT_RETRIES = 2;

function coerceString(v: unknown): string {
  if (v === undefined || v === null) return '';
  return String(v);
}

/**
 * Normalize URL path prefix
 * Ensures leading slash and no trailing slash
 */
function normalizePrefix(p: string): string {
  let v = coerceString(p);
  if (!v.startsWith('/')) v = '/' + v;
  if (v.length > 1 && v.endsWith('/')) v = v.slice(0, -1);
  return v;
}

/**
 * Derive service prefix from service name
 * Examples:
 *   'user-service' -> '/api/user'
 *   'user' -> '/api/user'
 *   'my-api-service' -> '/api/my-api'
 */
function derivePrefix(serviceName: string): string {
  // Remove '-service' suffix if present
  const base = serviceName.replace(/-service$/, '');
  return normalizePrefix(`/api/${base}`);
}

/**
 * Derive rewrite prefix from prefix
 * Examples:
 *   '/api/user' -> 'user'
 *   '/user' -> 'user'
 *   '/api/' -> '' (use service name as fallback)
 */
function deriveRewritePrefix(prefix: string, serviceName: string): string {
  let rewrite = prefix.replace(/^\/api\//, '').replace(/^\//, '');
  if (!rewrite) {
    rewrite = serviceName.replace(/-service$/, '');
  }
  return rewrite;
}

export function normalizeServiceConfig(raw: unknown): ServiceConfig {
  if (!raw || typeof raw !== 'object') {
    throw new Error('service entry must be an object');
  }

  const config = raw as Record<string, unknown>;
  const nameRaw = coerceString(config.name || config.service);
  if (!nameRaw) {
    throw new Error('service entry missing required "name" field');
  }
  const name = nameRaw.replace(/_/g, '-');

  const upstream = coerceString(config.upstream || config.url);
  if (!upstream) {
    throw new Error(
      `service "${name}" missing required "upstream" or "url" field`
    );
  }

  // Validate upstream URL format
  validateUrl(upstream, `service "${name}"`);

  // Parse prefix
  let prefix: string;
  if (
    config.prefix !== undefined &&
    config.prefix !== null &&
    String(config.prefix).trim() !== ''
  ) {
    prefix = normalizePrefix(config.prefix as string);
  } else {
    prefix = derivePrefix(name);
    logger.info({ service: name, prefix }, 'Derived service prefix from name');
  }

  // Parse rewritePrefix
  let rewritePrefix: string;
  if (config.rewritePrefix !== undefined || config.rewrite !== undefined) {
    rewritePrefix = coerceString(config.rewritePrefix ?? config.rewrite);
  } else {
    rewritePrefix = deriveRewritePrefix(prefix, name);
    logger.info(
      { service: name, rewritePrefix },
      'Derived service rewritePrefix from prefix'
    );
  }

  // Parse and validate timeout
  let timeout: number;
  if (config.timeout !== undefined) {
    timeout = validatePositiveInteger(config.timeout, 'timeout', `service "${name}"`);
  } else {
    timeout = DEFAULT_TIMEOUT;
    logger.info(
      { service: name, timeout: DEFAULT_TIMEOUT },
      'Using default timeout'
    );
  }

  // Parse and validate retries
  let retries: number;
  if (config.retries !== undefined) {
    retries = validateNonNegativeInteger(config.retries, 'retries', `service "${name}"`);
  } else {
    retries = DEFAULT_RETRIES;
    logger.info(
      { service: name, retries: DEFAULT_RETRIES },
      'Using default retries'
    );
  }

  // Parse boolean flags
  const requiresAuth = normalizeBoolean(config.requiresAuth ?? config.auth);
  const websocket = normalizeBoolean(config.websocket ?? config.ws);

  return {
    name,
    upstream,
    prefix,
    rewritePrefix,
    timeout,
    retries,
    requiresAuth,
    websocket
  };
}

export function parseJsonServiceConfig(
  input: unknown,
  source: string
): ServiceConfig[] {
  if (!input) return [];
  if (!Array.isArray(input)) {
    throw new Error(`${source} must be a JSON array of services`);
  }

  const out: ServiceConfig[] = [];
  const errors: string[] = [];

  input.forEach((raw: unknown, idx: number) => {
    try {
      const s = normalizeServiceConfig(raw);
      out.push(s);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      errors.push(`index ${idx}: ${errorMessage}`);
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
  const servicesFile = process.env.SERVICES_FILE;
  let services: ServiceConfig[] = [];
  if (servicesFile) {
    if (!fs.existsSync(servicesFile)) {
      throw new Error(
        `SERVICES_FILE is set but file does not exist: ${servicesFile}`
      );
    }
    const raw = fs.readFileSync(servicesFile, 'utf8');
    const parsed = parseJsonSafe(raw, `SERVICES_FILE(${servicesFile})`);
    services = parseJsonServiceConfig(parsed, `SERVICES_FILE(${servicesFile})`);
  } else if (process.env.SERVICES) {
    const parsed = parseJsonSafe(process.env.SERVICES, 'SERVICES env var');
    services = parseJsonServiceConfig(parsed, 'SERVICES env var');
  }

  if (!services || services.length === 0) return [];

  const nameSet = new Set<string>();
  const prefixSet = new Set<string>();
  const duplicates: string[] = [];

  for (const s of services) {
    if (nameSet.has(s.name)) duplicates.push(`name:${s.name}`);
    nameSet.add(s.name);
    const p = s.prefix ?? '';
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
