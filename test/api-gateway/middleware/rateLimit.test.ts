import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { rateLimitMiddleware, rateLimiter } from '../../../src/api-gateway/src/middleware/rateLimit';
import { config } from '../../../src/api-gateway/src/config';

describe('RateLimiter', () => {
  beforeEach(() => {
    // Clear the rate limiter state before each test
    rateLimiter['requests'].clear();
  });

  describe('isAllowed', () => {
    it('should allow requests within the limit', () => {
      const result = rateLimiter.isAllowed('test-key', 5, 60000);
      expect(result).toBe(true);
    });

    it('should allow exactly maxRequests requests', () => {
      const key = 'test-key';
      const maxRequests = 3;
      const windowMs = 60000;

      for (let i = 0; i < maxRequests; i++) {
        expect(rateLimiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
      }
    });

    it('should reject requests exceeding the limit', () => {
      const key = 'test-key';
      const maxRequests = 3;
      const windowMs = 60000;

      // Make maxRequests requests
      for (let i = 0; i < maxRequests; i++) {
        rateLimiter.isAllowed(key, maxRequests, windowMs);
      }

      // Next request should be rejected
      expect(rateLimiter.isAllowed(key, maxRequests, windowMs)).toBe(false);
    });

    it('should reset after time window expires', async () => {
      const key = 'test-key';
      const maxRequests = 2;
      const windowMs = 100; // 100ms window

      // Make maxRequests requests
      rateLimiter.isAllowed(key, maxRequests, windowMs);
      rateLimiter.isAllowed(key, maxRequests, windowMs);

      // Should be rejected
      expect(rateLimiter.isAllowed(key, maxRequests, windowMs)).toBe(false);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be allowed again
      expect(rateLimiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
    });

    it('should track different keys independently', () => {
      const key1 = 'key1';
      const key2 = 'key2';
      const maxRequests = 2;
      const windowMs = 60000;

      // Exhaust key1's limit
      rateLimiter.isAllowed(key1, maxRequests, windowMs);
      rateLimiter.isAllowed(key1, maxRequests, windowMs);
      expect(rateLimiter.isAllowed(key1, maxRequests, windowMs)).toBe(false);

      // key2 should still be allowed
      expect(rateLimiter.isAllowed(key2, maxRequests, windowMs)).toBe(true);
      expect(rateLimiter.isAllowed(key2, maxRequests, windowMs)).toBe(true);
      expect(rateLimiter.isAllowed(key2, maxRequests, windowMs)).toBe(false);
    });

    it('should filter out old timestamps beyond the window', async () => {
      const key = 'test-key';
      const maxRequests = 2;
      const windowMs = 100;

      // Make requests
      rateLimiter.isAllowed(key, maxRequests, windowMs);
      rateLimiter.isAllowed(key, maxRequests, windowMs);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be able to make maxRequests again
      expect(rateLimiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
      expect(rateLimiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
      expect(rateLimiter.isAllowed(key, maxRequests, windowMs)).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should remove entries with no recent requests', async () => {
      const key = 'test-key';
      const windowMs = 100;

      rateLimiter.isAllowed(key, 1, windowMs);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      rateLimiter.cleanup(windowMs);

      expect(rateLimiter['requests'].has(key)).toBe(false);
    });

    it('should keep entries with recent requests', () => {
      const key = 'test-key';
      const windowMs = 60000;

      rateLimiter.isAllowed(key, 1, windowMs);
      rateLimiter.cleanup(windowMs);

      expect(rateLimiter['requests'].has(key)).toBe(true);
    });

    it('should clean up old timestamps but keep recent ones', async () => {
      const key = 'test-key';
      const windowMs = 100;
      const cleanupWindowMs = 200;

      // Make request
      rateLimiter.isAllowed(key, 1, windowMs);

      // Wait for window to expire but not cleanup window
      await new Promise(resolve => setTimeout(resolve, 150));

      // Make another request (this resets the window)
      rateLimiter.isAllowed(key, 1, windowMs);

      // Cleanup should not remove this entry
      rateLimiter.cleanup(cleanupWindowMs);
      expect(rateLimiter['requests'].has(key)).toBe(true);
    });
  });
});

describe('rateLimitMiddleware', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    // Reset rate limiter state
    rateLimiter['requests'].clear();

    mockRequest = {
      ip: '127.0.0.1',
      url: '/api/test',
      user: undefined,
      log: {
        error: vi.fn(),
      } as any,
    };

    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  it('should allow request within global rate limit', async () => {
    await rateLimitMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockReply.code).not.toHaveBeenCalled();
    expect(mockReply.send).not.toHaveBeenCalled();
  });

  it('should reject request exceeding global rate limit', async () => {
    const globalLimit = config.rateLimits.global.max;
    const key = `user:${mockRequest.ip}`;
    const windowMs = 60 * 1000; // 1 minute

    // Exhaust the global limit
    for (let i = 0; i < globalLimit; i++) {
      rateLimiter.isAllowed(key, globalLimit, windowMs);
    }

    await rateLimitMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockReply.code).toHaveBeenCalledWith(429);
    expect(mockReply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
      })
    );
  });

  it('should use authenticated limit for authenticated users', async () => {
    const authLimit = config.rateLimits.authenticated.max;
    mockRequest.user = {
      sub: 'user-123',
      email: 'test@example.com',
      role: 'user',
      iat: Date.now(),
      exp: Date.now() + 3600000,
    };

    const key = `user:${mockRequest.user.sub}`;
    const windowMs = 60 * 1000;

    // Exhaust the authenticated limit
    for (let i = 0; i < authLimit; i++) {
      rateLimiter.isAllowed(key, authLimit, windowMs);
    }

    await rateLimitMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockReply.code).toHaveBeenCalledWith(429);
  });

  it('should apply endpoint-specific rate limit', async () => {
    const endpoint = '/api/auth/login';
    const endpointLimit = config.rateLimits.endpoints[endpoint];
    mockRequest.url = endpoint;
    const key = `endpoint:${endpoint}:${mockRequest.ip}`;
    const windowMs = 60 * 1000;

    // Exhaust the endpoint limit
    for (let i = 0; i < endpointLimit.max; i++) {
      rateLimiter.isAllowed(key, endpointLimit.max, windowMs);
    }

    await rateLimitMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockReply.code).toHaveBeenCalledWith(429);
    expect(mockReply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        message: `Rate limit exceeded for ${endpoint}`,
      })
    );
  });

  it('should prioritize endpoint-specific limit over global limit', async () => {
    const endpoint = '/api/auth/login';
    mockRequest.url = endpoint;
    const endpointLimit = config.rateLimits.endpoints[endpoint];
    const key = `endpoint:${endpoint}:${mockRequest.ip}`;
    const windowMs = 60 * 1000;

    // Exhaust endpoint limit but stay within global limit
    for (let i = 0; i < endpointLimit.max; i++) {
      rateLimiter.isAllowed(key, endpointLimit.max, windowMs);
    }

    await rateLimitMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    // Should be rejected by endpoint limit
    expect(mockReply.code).toHaveBeenCalledWith(429);
    expect(mockReply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        message: `Rate limit exceeded for ${endpoint}`,
      })
    );
  });

  it('should handle URL with query parameters', async () => {
    mockRequest.url = '/api/test?param=value';
    const endpoint = '/api/test';
    const endpointLimit = config.rateLimits.endpoints[endpoint];
    
    if (endpointLimit) {
      const key = `endpoint:${endpoint}:${mockRequest.ip}`;
      const windowMs = 60 * 1000;

      for (let i = 0; i < endpointLimit.max; i++) {
        rateLimiter.isAllowed(key, endpointLimit.max, windowMs);
      }
    }

    await rateLimitMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);
    // Should work correctly (no exception thrown)
    expect(mockRequest.log?.error).not.toHaveBeenCalled();
  });

  it('should use IP when user is not authenticated', async () => {
    mockRequest.user = undefined;
    mockRequest.ip = '192.168.1.1';

    const key = `user:${mockRequest.ip}`;
    const globalLimit = config.rateLimits.global.max;
    const windowMs = 60 * 1000;

    // Exhaust global limit
    for (let i = 0; i < globalLimit; i++) {
      rateLimiter.isAllowed(key, globalLimit, windowMs);
    }

    await rateLimitMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockReply.code).toHaveBeenCalledWith(429);
  });

  it('should use user.sub when user is authenticated', async () => {
    mockRequest.user = {
      sub: 'user-456',
      email: 'test@example.com',
      role: 'user',
      iat: Date.now(),
      exp: Date.now() + 3600000,
    };

    const key = `user:${mockRequest.user.sub}`;
    const authLimit = config.rateLimits.authenticated.max;
    const windowMs = 60 * 1000;

    // Exhaust authenticated limit
    for (let i = 0; i < authLimit; i++) {
      rateLimiter.isAllowed(key, authLimit, windowMs);
    }

    await rateLimitMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockReply.code).toHaveBeenCalledWith(429);
  });

  it('should include retryAfter in error response', async () => {
    const globalLimit = config.rateLimits.global.max;
    const key = `user:${mockRequest.ip}`;
    const windowMs = 60 * 1000; // 1 minute = 60 seconds

    // Exhaust the limit
    for (let i = 0; i < globalLimit; i++) {
      rateLimiter.isAllowed(key, globalLimit, windowMs);
    }

    await rateLimitMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockReply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        retryAfter: 60,
      })
    );
  });

  it('should handle errors gracefully and fail open', async () => {
    // Test error handling by causing an error in the middleware
    // We'll use an invalid URL that might cause issues
    mockRequest.url = null as any;

    await rateLimitMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    // Should log error but not reject request (fail open)
    expect(mockRequest.log?.error).toHaveBeenCalled();
    // In fail-open mode, request should not be rejected
    expect(mockReply.code).not.toHaveBeenCalled();
  });

  it('should handle missing endpoint in rate limits config', async () => {
    mockRequest.url = '/api/unknown-endpoint';

    await rateLimitMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    // Should not throw and should fall back to global limit
    expect(mockRequest.log?.error).not.toHaveBeenCalled();
  });

  // Note: parseTimeWindow is an internal function and is tested indirectly
  // through rateLimitMiddleware's use of valid time window strings from config
  it('should handle valid time window formats from config', async () => {
    // This indirectly verifies parseTimeWindow handles valid formats
    mockRequest.url = '/api/auth/login';
    
    await rateLimitMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);
    
    // Should not throw for valid time windows (1 minute, etc.)
    expect(mockRequest.log?.error).not.toHaveBeenCalled();
  });
});
