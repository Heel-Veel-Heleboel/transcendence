import { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config';

// In-memory rate limiter
class RateLimiter {
  private requests = new Map<string, number[]>();

  isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;

    const timestamps = this.requests.get(key) || [];
    const recentRequests = timestamps.filter(ts => ts > windowStart);

    if (recentRequests.length >= maxRequests) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    return true;
  }

  // Remove old timestamps periodically
  cleanup(windowMs: number = 60 * 60 * 1000) {
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      const recent = timestamps.filter(ts => ts > now - windowMs);
      if (recent.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recent);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

// Converts string time window to milliseconds (e.g. "1 minute" -> 60000 ms)
function parseTimeWindow(timeWindow: string): number {
  const match = timeWindow.match(/^(\d+)\s*(second|minute|hour)s?$/i);
  if (!match) throw new Error(`Invalid time window: ${timeWindow}`);
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
  case 'second':
    return value * 1000;
  case 'minute':
    return value * 60 * 1000;
  case 'hour':
    return value * 60 * 60 * 1000;
  default:
    throw new Error(`Unknown unit: ${unit}`);
  }
}

export async function rateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const clientId = request.user?.sub || request.ip;
    const endpoint = request.url.split('?')[0];

    // Check endpoint-specific limits. Support both shapes:
    // - map: { '/path': { max, timeWindow }, ... }
    // - array: [ { path, limit }, ... ]
    let endpointLimit: any;
    const endpointsCfg = (config.rateLimits as any).endpoints;
    if (Array.isArray(endpointsCfg)) {
      const found = endpointsCfg.find((e: any) => e.path === endpoint);
      endpointLimit = found?.limit;
    } else if (endpointsCfg && typeof endpointsCfg === 'object') {
      endpointLimit = endpointsCfg[endpoint];
    }

    if (endpointLimit) {
      const windowMs = parseTimeWindow(endpointLimit.timeWindow);
      const key = `endpoint:${endpoint}:${clientId}`;
      if (!rateLimiter.isAllowed(key, endpointLimit.max, windowMs)) {
        reply.code(429).send({
          statusCode: 429,
          error: 'Too Many Requests',
          message: `Rate limit exceeded for ${endpoint}`,
          retryAfter: Math.ceil(windowMs / 1000)
        });
        return;
      }
    }

    // Check global/user limits
    const userLimit = request.user
      ? config.rateLimits.authenticated
      : config.rateLimits.global;
    const windowMs = parseTimeWindow(userLimit.timeWindow);
    const key = `user:${clientId}`;

    if (!rateLimiter.isAllowed(key, userLimit.max, windowMs)) {
      reply.code(429).send({
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        retryAfter: Math.ceil(windowMs / 1000)
      });
      return;
    }
  } catch (error) {
    request.log.error({ error }, 'Rate limiter error');
    // Fail open: allow requests if limiter fails
  }
}
