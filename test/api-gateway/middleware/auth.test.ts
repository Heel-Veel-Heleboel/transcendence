import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { authMiddleware, verifyToken, authGuard } from '../../../src/api-gateway/src/middleware/auth';
import { config } from '../../../src/api-gateway/src/config';
import type { JWTPayload } from '../../../src/api-gateway/src/entity/common';

describe('authMiddleware', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    mockRequest = {
      headers: {},
      user: undefined,
      log: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      } as any,
    };

    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    if (originalNodeEnv) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  it('should set user to undefined when no authorization header in production', async () => {
    mockRequest.headers = {};
    await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockRequest.user).toBeUndefined();
    expect(mockReply.code).not.toHaveBeenCalled();
  });

  it('should set user to undefined when authorization header is missing in production', async () => {
    mockRequest.headers = { authorization: undefined };
    await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockRequest.user).toBeUndefined();
    expect(mockReply.code).not.toHaveBeenCalled();
  });

  it('should set user to undefined when authorization header does not start with Bearer', async () => {
    mockRequest.headers = { authorization: 'Invalid token' };
    await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockRequest.user).toBeUndefined();
    expect(mockReply.code).not.toHaveBeenCalled();
  });

  it('should return 400 for malformed authorization header', async () => {
    mockRequest.headers = { authorization: 'Bearer token extra' };
    await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockReply.code).toHaveBeenCalledWith(400);
    expect(mockReply.send).toHaveBeenCalledWith({ error: 'Malformed Authorization header' });
  });

  it('should extract and verify valid JWT token', async () => {
    const payload: JWTPayload = {
      sub: 'user-123',
      email: 'test@example.com',
      role: 'user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    const token = jwt.sign(payload, config.jwtSecret);
    mockRequest.headers = { authorization: `Bearer ${token}` };

    await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockRequest.user).toBeDefined();
    expect(mockRequest.user?.sub).toBe('user-123');
    expect(mockRequest.user?.email).toBe('test@example.com');
    expect(mockRequest.log?.info).toHaveBeenCalledWith(
      { userId: 'user-123' },
      'Authenticated request'
    );
  });

  it('should set user to undefined for expired token', async () => {
    const payload: JWTPayload = {
      sub: 'user-123',
      email: 'test@example.com',
      role: 'user',
      iat: Math.floor(Date.now() / 1000) - 7200,
      exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
    };

    const token = jwt.sign(payload, config.jwtSecret);
    mockRequest.headers = { authorization: `Bearer ${token}` };

    await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockRequest.user).toBeUndefined();
    expect(mockRequest.log?.warn).toHaveBeenCalledWith('Expired JWT token');
  });

  it('should set user to undefined for invalid token', async () => {
    const invalidToken = 'invalid.token.here';
    mockRequest.headers = { authorization: `Bearer ${invalidToken}` };

    await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockRequest.user).toBeUndefined();
    expect(mockRequest.log?.warn).toHaveBeenCalled();
  });

  it('should set user to undefined for token signed with wrong secret', async () => {
    const payload: JWTPayload = {
      sub: 'user-123',
      email: 'test@example.com',
      role: 'user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    const token = jwt.sign(payload, 'wrong-secret');
    mockRequest.headers = { authorization: `Bearer ${token}` };

    await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockRequest.user).toBeUndefined();
    expect(mockRequest.log?.warn).toHaveBeenCalled();
  });

  it('should allow request without auth header in non-production environments', async () => {
    process.env.NODE_ENV = 'development';
    mockRequest.headers = {};

    await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockRequest.user).toBeUndefined();
    expect(mockReply.code).not.toHaveBeenCalled();
  });

  it('should handle empty Bearer token', async () => {
    mockRequest.headers = { authorization: 'Bearer ' };

    await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockRequest.user).toBeUndefined();
    expect(mockRequest.log?.warn).toHaveBeenCalled();
  });
});

describe('verifyToken', () => {
  let mockRequest: Partial<FastifyRequest>;

  beforeEach(() => {
    mockRequest = {
      log: {
        warn: vi.fn(),
        error: vi.fn(),
      } as any,
    };
  });

  it('should return payload for valid token', () => {
    const payload: JWTPayload = {
      sub: 'user-123',
      email: 'test@example.com',
      role: 'admin',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    const token = jwt.sign(payload, config.jwtSecret);
    const result = verifyToken(token, mockRequest as FastifyRequest);

    expect(result).toBeDefined();
    expect(result?.sub).toBe('user-123');
    expect(result?.email).toBe('test@example.com');
    expect(result?.role).toBe('admin');
  });

  it('should return null for expired token', () => {
    const payload: JWTPayload = {
      sub: 'user-123',
      email: 'test@example.com',
      role: 'user',
      iat: Math.floor(Date.now() / 1000) - 7200,
      exp: Math.floor(Date.now() / 1000) - 3600,
    };

    const token = jwt.sign(payload, config.jwtSecret);
    const result = verifyToken(token, mockRequest as FastifyRequest);

    expect(result).toBeNull();
    expect(mockRequest.log?.warn).toHaveBeenCalledWith('Expired JWT token');
  });

  it('should return null for invalid token', () => {
    const invalidToken = 'not.a.valid.token';
    const result = verifyToken(invalidToken, mockRequest as FastifyRequest);

    expect(result).toBeNull();
    expect(mockRequest.log?.warn).toHaveBeenCalled();
  });

  it('should return null for token with wrong secret', () => {
    const payload: JWTPayload = {
      sub: 'user-123',
      email: 'test@example.com',
      role: 'user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    const token = jwt.sign(payload, 'wrong-secret');
    const result = verifyToken(token, mockRequest as FastifyRequest);

    expect(result).toBeNull();
    expect(mockRequest.log?.warn).toHaveBeenCalled();
  });

  it('should handle unexpected JWT errors', () => {
    // Mock jwt.verify to throw an unexpected error
    const originalVerify = jwt.verify;
    vi.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    const result = verifyToken('any-token', mockRequest as FastifyRequest);

    expect(result).toBeNull();
    expect(mockRequest.log?.error).toHaveBeenCalled();

    jwt.verify = originalVerify;
  });

  it('should return null for empty token', () => {
    const result = verifyToken('', mockRequest as FastifyRequest);

    expect(result).toBeNull();
    expect(mockRequest.log?.warn).toHaveBeenCalled();
  });
});

describe('authGuard', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    mockRequest = {
      user: undefined,
    };

    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  it('should return 401 when user is not authenticated', async () => {
    mockRequest.user = undefined;
    const middleware = authGuard();

    await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockReply.code).toHaveBeenCalledWith(401);
    expect(mockReply.send).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should allow request when user is authenticated and no roles required', async () => {
    mockRequest.user = {
      sub: 'user-123',
      email: 'test@example.com',
      role: 'user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const middleware = authGuard();

    await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockReply.code).not.toHaveBeenCalled();
    expect(mockReply.send).not.toHaveBeenCalled();
  });

  it('should allow request when user has required role', async () => {
    mockRequest.user = {
      sub: 'user-123',
      email: 'test@example.com',
      role: 'admin',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const middleware = authGuard(['admin', 'moderator']);

    await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockReply.code).not.toHaveBeenCalled();
    expect(mockReply.send).not.toHaveBeenCalled();
  });

  it('should return 403 when user does not have required role', async () => {
    mockRequest.user = {
      sub: 'user-123',
      email: 'test@example.com',
      role: 'user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const middleware = authGuard(['admin']);

    await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockReply.code).toHaveBeenCalledWith(403);
    expect(mockReply.send).toHaveBeenCalledWith({ error: 'Forbidden' });
  });

  it('should return 403 when user role is not in allowed roles list', async () => {
    mockRequest.user = {
      sub: 'user-123',
      email: 'test@example.com',
      role: 'guest',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const middleware = authGuard(['admin', 'moderator']);

    await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockReply.code).toHaveBeenCalledWith(403);
    expect(mockReply.send).toHaveBeenCalledWith({ error: 'Forbidden' });
  });

  it('should allow request when user has one of multiple allowed roles', async () => {
    mockRequest.user = {
      sub: 'user-123',
      email: 'test@example.com',
      role: 'moderator',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const middleware = authGuard(['admin', 'moderator', 'user']);

    await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockReply.code).not.toHaveBeenCalled();
    expect(mockReply.send).not.toHaveBeenCalled();
  });

  it('should return 403 for empty roles array (no role matches empty array)', async () => {
    mockRequest.user = {
      sub: 'user-123',
      email: 'test@example.com',
      role: 'user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const middleware = authGuard([]);

    await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    // Empty array means no roles are allowed (roles is truthy but empty)
    expect(mockReply.code).toHaveBeenCalledWith(403);
    expect(mockReply.send).toHaveBeenCalledWith({ error: 'Forbidden' });
  });

  it('should allow request when roles parameter is undefined', async () => {
    mockRequest.user = {
      sub: 'user-123',
      email: 'test@example.com',
      role: 'user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const middleware = authGuard(); // No roles parameter

    await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    // Should allow since no roles are required (just authentication)
    expect(mockReply.code).not.toHaveBeenCalled();
  });
});
