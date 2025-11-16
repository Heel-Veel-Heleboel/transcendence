import fs from 'fs';
import { z } from 'zod';
import { ServiceConfig } from '../entity/common';

// Minimal zod schema to validate core types after normalization
const serviceSchema = z.object({
  name: z.string(),
  upstream: z.string(),
  prefix: z.string().optional(),
  rewritePrefix: z.string().optional(),
  timeout: z.number().int().optional(),
  retries: z.number().int().optional(),
  requiresAuth: z.boolean().optional(),
  requiresAuthRoles: z.array(z.string()).optional(),
  websocket: z.boolean().optional(),
  websocketPath: z.string().optional()
});

function normalizeService(raw: any): ServiceConfig | null {
  if (!raw || typeof raw !== 'object') return null;

  const name = (raw.name || raw.service || 'unknown-service').toString();
  const upstream = (raw.upstream || raw.url || '').toString();
  if (!upstream) {
    console.warn(`[WARNING] Skipping service ${name}: missing upstream/url`);
    return null;
  }

  const prefix = raw.prefix || `/api/${name.replace(/-service$/, '')}`;
  const rewritePrefix =
    raw.rewritePrefix ??
    raw.rewrite ??
    (typeof raw.prefix === 'string'
      ? raw.prefix.replace('/api/', '')
      : prefix.replace('/api/', ''));

  const timeout = raw.timeout !== undefined ? Number(raw.timeout) : undefined;
  const retries = raw.retries !== undefined ? Number(raw.retries) : undefined;

  const requiresAuth = raw.requiresAuth ?? raw.auth ?? false;

  let requiresAuthRoles: string[] | undefined;
  if (raw.requiresAuthRoles) {
    requiresAuthRoles = Array.isArray(raw.requiresAuthRoles)
      ? raw.requiresAuthRoles.map((r: any) => String(r))
      : String(raw.requiresAuthRoles)
        .split(',')
        .map((r: string) => r.trim());
  } else if (raw.roles) {
    requiresAuthRoles = String(raw.roles)
      .split(',')
      .map((r: string) => r.trim());
  }

  const websocket = raw.websocket ?? raw.ws ?? false;
  const websocketPath = raw.websocketPath || raw.wsPath || undefined;

  // Validate (soft) with zod: log validation errors but continue (fail-open)
  try {
    serviceSchema.parse({
      name,
      upstream,
      prefix,
      rewritePrefix,
      timeout: timeout !== undefined ? Number(timeout) : undefined,
      retries: retries !== undefined ? Number(retries) : undefined,
      requiresAuth: Boolean(requiresAuth),
      requiresAuthRoles,
      websocket: Boolean(websocket),
      websocketPath
    });
  } catch (e) {
    console.warn(`[WARNING] Service ${name} failed schema validation:`, e);
    // continue — we still return normalized object if it has required fields
  }

  const svc: ServiceConfig = {
    name: name.replace(/_/g, '-'),
    upstream,
    prefix,
    rewritePrefix,
    timeout: timeout !== undefined ? Number(timeout) : undefined,
    retries: retries !== undefined ? Number(retries) : undefined,
    requiresAuth:
      requiresAuth === true || String(requiresAuth) === 'true'
        ? true
        : undefined,
    requiresAuthRoles,
    websocket:
      websocket === true || String(websocket) === 'true' ? true : undefined,
    websocketPath
  };

  return svc;
}

function parseJsonServicesInput(input: any, source: string): ServiceConfig[] {
  const out: ServiceConfig[] = [];
  if (!input) return out;
  if (!Array.isArray(input)) {
    console.warn(`[WARNING] ${source} must be a JSON array of services`);
    return out;
  }

  input.forEach((raw: any, idx: number) => {
    const s = normalizeService(raw);
    if (s) out.push(s);
    else
      console.warn(
        `[WARNING] Skipping invalid service at index ${idx} in ${source}`
      );
  });

  return out;
}

/**
 * Parse services from configuration sources.
 * Precedence: SERVICES_FILE -> SERVICES env var -> [] (caller may fallback to defaults)
 * Fail-open: on errors we log and continue to next source.
 */
export function parseServicesFromEnv(): ServiceConfig[] {
  // 1) File mounted JSON if SERVICES_FILE is set
  const servicesFile = process.env.SERVICES_FILE;
  if (servicesFile) {
    try {
      if (fs.existsSync(servicesFile)) {
        const raw = fs.readFileSync(servicesFile, 'utf8');
        const parsed = JSON.parse(raw);
        const parsedServices = parseJsonServicesInput(
          parsed,
          `SERVICES_FILE(${servicesFile})`
        );
        if (parsedServices.length > 0) return parsedServices;
        console.warn(`[WARNING] No valid services parsed from ${servicesFile}`);
      } else {
        console.warn(
          `[WARNING] SERVICES_FILE is set but file does not exist: ${servicesFile}`
        );
      }
    } catch (err) {
      console.warn(
        `[WARNING] Failed to read/parse SERVICES_FILE ${servicesFile}:`,
        err
      );
      // fail-open: continue to next source
    }
  }

  // 2) SERVICES env var
  if (process.env.SERVICES) {
    try {
      const parsed = JSON.parse(process.env.SERVICES);
      const parsedServices = parseJsonServicesInput(parsed, 'SERVICES env var');
      if (parsedServices.length > 0) return parsedServices;
      console.warn('[WARNING] No valid services parsed from SERVICES env var');
    } catch (err) {
      console.warn('[WARNING] Failed to parse SERVICES env var JSON:', err);
    }
  }

  // 3) No env-defined services — return empty so caller can fall back to defaults
  return [];
}

/**
 * Get default services (fallback when no env vars or files are set)
 */
export function getDefaultServices(): ServiceConfig[] {
  return [
    {
      name: 'user-service',
      upstream: 'http://user-service:3001',
      prefix: '/api/users',
      rewritePrefix: '/users',
      timeout: 5000,
      retries: 3
    },
    {
      name: 'game-service',
      upstream: 'http://game-service:3002',
      prefix: '/api/games',
      rewritePrefix: '/games',
      timeout: 10000,
      retries: 2
    },
    {
      name: 'matchmaking-service',
      upstream: 'http://matchmaking-service:3003',
      prefix: '/api/matchmaking',
      rewritePrefix: '/matchmaking',
      timeout: 5000,
      retries: 3
    },
    {
      name: 'chat-service',
      upstream: 'http://chat-service:3004',
      prefix: '/api/chat',
      rewritePrefix: '/chat',
      timeout: 3000,
      retries: 2
    },
    {
      name: 'tournament-service',
      upstream: 'http://tournament-service:3005',
      prefix: '/api/tournaments',
      rewritePrefix: '/tournaments',
      timeout: 5000,
      retries: 3
    },
    {
      name: 'localization-service',
      upstream: 'http://localization-service:3006',
      prefix: '/api/localization',
      rewritePrefix: '/localization',
      timeout: 2000,
      retries: 1
    }
  ];
}

/**
 * Merge environment-defined services with defaults.
 * Env/file services take priority, defaults fill in gaps.
 */
export function getServicesConfig(): ServiceConfig[] {
  const envServices = parseServicesFromEnv();

  // If services are defined in env/file, use them
  if (envServices.length > 0) {
    return envServices;
  }

  // Otherwise, fall back to defaults
  return getDefaultServices();
}
