import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { authMiddleware, verifyToken, authGuard } from '../../src/middleware/auth';
import type { JWTPayload } from '../../src/entity/common';

const privateKey = readFileSync(
  resolve(process.env.JWT_PRIVATE_KEY_PATH || './keys/jwt_private.pem'),
  'utf-8'
);

function signToken(payload: object, options?: jwt.SignOptions): string {
  return jwt.sign(payload, privateKey, { algorithm: 'RS256', ...options });
}

function makePayload(overrides?: Partial<JWTPayload>): { sub: number; user_email: string } {
  return {
    sub: 123,
    user_email: 'test@example.com',
    ...overrides,
  };
}

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
    const token = signToken(makePayload());
    mockRequest.headers = { authorization: `Bearer ${token}` };

    await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockRequest.user).toBeDefined();
    expect(mockRequest.user?.sub).toBe(123);
    expect(mockRequest.user?.user_email).toBe('test@example.com');
    expect(mockRequest.log?.info).toHaveBeenCalledWith(
      { user_id: 123 },
      'Authenticated request'
    );
  });

  it('should set user to undefined for expired token', async () => {
    const token = signToken(makePayload(), { expiresIn: -3600 });
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

  it('should set user to undefined for token signed with wrong key', async () => {
    const token = jwt.sign(makePayload(), 'wrong-secret');
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
    const token = signToken(makePayload({ sub: 456 }));
    const result = verifyToken(token, mockRequest as FastifyRequest);

    expect(result).toBeDefined();
    expect(result?.sub).toBe(456);
    expect(result?.user_email).toBe('test@example.com');
  });

  it('should return null for expired token', () => {
    const token = signToken(makePayload(), { expiresIn: -3600 });
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

  it('should return null for token with wrong key', () => {
    const token = jwt.sign(makePayload(), 'wrong-secret');
    const result = verifyToken(token, mockRequest as FastifyRequest);

    expect(result).toBeNull();
    expect(mockRequest.log?.warn).toHaveBeenCalled();
  });

  it('should handle unexpected JWT errors', () => {
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

  it('should allow request when user is authenticated', async () => {
    mockRequest.user = {
      sub: 123,
      user_email: 'test@example.com',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      iss: 'test',
      aud: 'test',
    };
    const middleware = authGuard();

    await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockReply.code).not.toHaveBeenCalled();
    expect(mockReply.send).not.toHaveBeenCalled();
  });
});
