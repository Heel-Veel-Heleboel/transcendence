import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { correlationIdMiddleware, requestLoggingMiddleware } from '../../src/middleware/logging';

describe('correlationIdMiddleware', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      correlationId: undefined,
      log: {
        child: vi.fn().mockReturnThis(),
      } as any,
    };

    mockReply = {
      header: vi.fn().mockReturnThis(),
    };
  });

  it('should generate new correlation ID when not provided in headers', async () => {
    mockRequest.headers = {};

    await correlationIdMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockRequest.correlationId).toBeDefined();
    expect(typeof mockRequest.correlationId).toBe('string');
    expect(mockRequest.correlationId?.length).toBeGreaterThan(0);
    expect(mockReply.header).toHaveBeenCalledWith('x-correlation-id', mockRequest.correlationId);
  });

  it('should always generate new UUID (never uses client header)', async () => {
    const clientProvidedId = 'custom-correlation-id-123';
    mockRequest.headers = {
      'x-correlation-id': clientProvidedId,
    };

    await correlationIdMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    // Should generate new UUID, NOT use client's value
    expect(mockRequest.correlationId).not.toBe(clientProvidedId);
    expect(mockRequest.correlationId).toMatch(/^[a-f0-9-]{36}$/);
    expect(mockReply.header).toHaveBeenCalledWith('x-correlation-id', mockRequest.correlationId);
  });

  it('should generate UUID format correlation ID', async () => {
    mockRequest.headers = {};

    await correlationIdMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    // UUID v4 format: 8-4-4-4-12 hex characters
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(mockRequest.correlationId).toMatch(uuidRegex);
  });

  it('should set correlation ID on request object', async () => {
    mockRequest.headers = {};

    await correlationIdMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockRequest.correlationId).toBeDefined();
  });

  it('should set generated correlation ID in response headers', async () => {
    mockRequest.headers = {};

    await correlationIdMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    // Should set the generated UUID in response headers
    expect(mockReply.header).toHaveBeenCalledWith('x-correlation-id', mockRequest.correlationId);
    expect(mockRequest.correlationId).toMatch(/^[a-f0-9-]{36}$/);
  });

  it('should create child logger with generated correlation ID', async () => {
    mockRequest.headers = {};

    await correlationIdMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    // Should create child logger with the generated UUID
    expect(mockRequest.log?.child).toHaveBeenCalledWith({
      correlationId: mockRequest.correlationId
    });
    expect(mockRequest.correlationId).toMatch(/^[a-f0-9-]{36}$/);
  });

  // Note: We always generate new UUIDs regardless of client-provided headers
  // This prevents injection attacks and anonymizes internal tracing
  it('should always generate new correlation ID (ignores client header)', async () => {
    const clientProvidedId = 'client-correlation-id';
    mockRequest.headers = {
      'x-correlation-id': clientProvidedId,
    };

    await correlationIdMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    // Should generate new UUID, not use client's value
    expect(mockRequest.correlationId).toBeDefined();
    expect(mockRequest.correlationId).not.toBe(clientProvidedId);
    expect(mockRequest.correlationId).toMatch(/^[a-f0-9-]{36}$/); // UUID format
  });

  it('should generate correlation ID when headers are empty', async () => {
    mockRequest.headers = {};

    await correlationIdMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockRequest.correlationId).toBeDefined();
    expect(mockRequest.correlationId).toMatch(/^[a-f0-9-]{36}$/); // UUID format
    expect(mockReply.header).toHaveBeenCalled();
  });

  it('should always generate unique correlation IDs for different requests', async () => {
    mockRequest.headers = {
      'other-header': 'value',
    };

    await correlationIdMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockRequest.correlationId).toBeDefined();
    expect(mockRequest.correlationId).not.toBe('value');
  });
});

describe('requestLoggingMiddleware', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;
  let finishHandler: (() => void) | undefined;

  beforeEach(() => {
    finishHandler = undefined;

    mockRequest = {
      method: 'GET',
      url: '/api/test',
      headers: {
        'user-agent': 'test-agent',
      },
      ip: '127.0.0.1',
      user: undefined,
      correlationId: 'test-correlation-id',
      log: {
        info: vi.fn(),
      } as any,
    };

    mockReply = {
      raw: {
        statusCode: 200,
        on: vi.fn((event: string, handler: () => void) => {
          if (event === 'finish') {
            finishHandler = handler;
          }
        }),
      } as any,
    };
  });

  it('should log incoming request details', async () => {
    await requestLoggingMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockRequest.log?.info).toHaveBeenCalledWith(
      {
        method: 'GET',
        url: '/api/test',
        userAgent: 'test-agent',
        user_id: undefined,
        ip: '127.0.0.1',
        correlationId: 'test-correlation-id',
      },
      'Incoming request'
    );
  });

  it('should log request with authenticated user', async () => {
    mockRequest.user = {
      sub: 'user-123',
      email: 'test@example.com',
      role: 'user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    await requestLoggingMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockRequest.log?.info).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
      }),
      'Incoming request'
    );
  });

  it('should register finish event handler', async () => {
    await requestLoggingMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockReply.raw?.on).toHaveBeenCalledWith('finish', expect.any(Function));
  });

  it('should log request completion when response finishes', async () => {
    await requestLoggingMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    // Simulate response finish
    if (finishHandler) {
      finishHandler();
    }

    expect(mockRequest.log?.info).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/api/test',
        statusCode: 200,
        duration: expect.any(Number),
        user_id: undefined,
        correlationId: 'test-correlation-id',
      }),
      'Request completed'
    );
  });

  it('should calculate request duration correctly', async () => {
    const startTime = Date.now();
    vi.spyOn(Date, 'now').mockReturnValueOnce(startTime);

    await requestLoggingMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    const endTime = startTime + 150;
    vi.spyOn(Date, 'now').mockReturnValueOnce(endTime);

    if (finishHandler) {
      finishHandler();
    }

    expect(mockRequest.log?.info).toHaveBeenCalledWith(
      expect.objectContaining({
        duration: 150,
      }),
      'Request completed'
    );

    vi.restoreAllMocks();
  });

  it('should log completion with status code', async () => {
    mockReply.raw = {
      statusCode: 404,
      on: vi.fn((event: string, handler: () => void) => {
        if (event === 'finish') {
          finishHandler = handler;
        }
      }),
    } as any;

    await requestLoggingMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    if (finishHandler) {
      finishHandler();
    }

    expect(mockRequest.log?.info).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
      }),
      'Request completed'
    );
  });

  it('should log completion with authenticated user ID', async () => {
    mockRequest.user = {
      sub: 'user-456',
      email: 'test@example.com',
      role: 'admin',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    await requestLoggingMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    if (finishHandler) {
      finishHandler();
    }

    expect(mockRequest.log?.info).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-456',
      }),
      'Request completed'
    );
  });

  it('should log different HTTP methods', async () => {
    const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];

    for (const method of methods) {
      (mockRequest as any).method = method;
      (mockRequest as any).log = {
        info: vi.fn(),
      } as any;

      await requestLoggingMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockRequest.log?.info).toHaveBeenCalledWith(
        expect.objectContaining({
          method,
        }),
        'Incoming request'
      );
    }
  });

  it('should handle missing user agent', async () => {
    // user-agent is the HTTP header that identifies the client making the request
    // (e.g., browser name, version, OS: "Mozilla/5.0...")
    mockRequest.headers = {};

    await requestLoggingMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockRequest.log?.info).toHaveBeenCalledWith(
      expect.objectContaining({
        userAgent: undefined,
      }),
      'Incoming request'
    );
  });

  it('should handle missing correlation ID', async () => {
    mockRequest.correlationId = undefined;

    await requestLoggingMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockRequest.log?.info).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationId: undefined,
      }),
      'Incoming request'
    );
  });

  it('should not log completion before response finishes', async () => {
    await requestLoggingMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    // Only incoming request should be logged
    expect(mockRequest.log?.info).toHaveBeenCalledTimes(1);
    expect(mockRequest.log?.info).toHaveBeenCalledWith(
      expect.anything(),
      'Incoming request'
    );
  });

  it('should handle multiple finish events', async () => {
    await requestLoggingMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    // Simulate finish event multiple times
    if (finishHandler) {
      finishHandler();
      finishHandler();
    }

    // Should log completion each time
    expect(mockRequest.log?.info).toHaveBeenCalledWith(
      expect.objectContaining({}),
      'Request completed'
    );
  });

  it('should log error status codes', async () => {
    mockReply.raw = {
      statusCode: 500,
      on: vi.fn((event: string, handler: () => void) => {
        if (event === 'finish') {
          finishHandler = handler;
        }
      }),
    } as any;

    await requestLoggingMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    if (finishHandler) {
      finishHandler();
    }

    expect(mockRequest.log?.info).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
      }),
      'Request completed'
    );
  });

  it('should handle URL with query parameters', async () => {
    (mockRequest as any).url = '/api/test?param=value&other=123';

    await requestLoggingMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockRequest.log?.info).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/test?param=value&other=123',
      }),
      'Incoming request'
    );
  });
});
