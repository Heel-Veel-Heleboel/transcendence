import { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config';

// Simple in-memory rate limiter (use Redis in production)
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const userRequests = this.requests.get(key)!;
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => time > windowStart);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }

  cleanup(): void {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => time > oneHourAgo);
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }
}

const rateLimiter = new RateLimiter();

// Cleanup old entries every 5 minutes
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);

function parseTimeWindow(timeWindow: string): number {
  const match = timeWindow.match(/^(\d+)\s*(second|minute|hour)s?$/i);
  if (!match) {
    throw new Error(`Invalid time window format: ${timeWindow}`);
  }
  
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
      throw new Error(`Unknown time unit: ${unit}`);
  }
}

export async function rateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const clientId = request.user?.sub || request.ip;
    const endpoint = request.url.split('?')[0]; // Remove query params
    
    // Check endpoint-specific limits first
    const endpointLimit = config.rateLimits.endpoints[endpoint];
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
    
    // Check user-specific limits
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
    request.log.error({ error }, 'Rate limit middleware error');
    // Continue on error - don't block requests due to rate limiter issues
  }
}


