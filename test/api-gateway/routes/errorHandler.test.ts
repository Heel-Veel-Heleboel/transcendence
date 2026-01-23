import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatAndSendError, ServiceUnavailableError, handleError, setupProxyErrorHandler } from '../../../src/api-gateway/src/routes/errorHandler';
import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify';

/**
 * Helper function to create mock FastifyError for testing
 */
function createMockError(message: string, statusCode: number): FastifyError {
  const err = new Error(message) as FastifyError;
  err.statusCode = statusCode;
  return err;
}

function makeFakeReqReply(correlationId?: string) {
  const req: any = {
    url: '/test/path',
    method: 'GET',
    log: { error: vi.fn() }
  };
  if (correlationId) req.correlationId = correlationId;

  const reply: any = {
    status: 200,
    sent: undefined as any,
    code(s: number) {
      this.status = s;
      return { send: (payload: any) => { this.sent = payload; } };
    },
    send(payload: any) { this.sent = payload; }
  };

  return { req, reply };
}

describe('formatAndSendError', () => {
  let oldEnv: string | undefined;

  beforeEach(() => {
    oldEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = oldEnv;
    vi.resetAllMocks();
  });

  it('handles 400 error with proper name and correlation ID', () => {
    const err = createMockError('invalid payload', 400);
    const { req, reply } = makeFakeReqReply('corr-1');

    formatAndSendError(err as any, req, reply);

    expect(reply.status).toBe(400);
    expect(reply.sent).toHaveProperty('statusCode', 400);
    expect(reply.sent).toHaveProperty('error', 'Bad Request');
    expect(reply.sent).toHaveProperty('message', 'invalid payload');
    expect(reply.sent).toHaveProperty('correlationId', 'corr-1');
    expect(typeof reply.sent.timestamp).toBe('string');
  });

  it('handles ServiceUnavailableError as 503', () => {
    const err = new ServiceUnavailableError('user-service');
    const { req, reply } = makeFakeReqReply();

    formatAndSendError(err as any, req, reply);

    expect(reply.status).toBe(503);
    expect(reply.sent.statusCode).toBe(503);
    expect(reply.sent.error).toBe('Service Unavailable');
    expect(reply.sent.message).toContain('user-service');
  });

  it('handles 401 error as Unauthorized', () => {
    const err = createMockError('Authentication required', 401);
    const { req, reply } = makeFakeReqReply();

    formatAndSendError(err as any, req, reply);

    expect(reply.status).toBe(401);
    expect(reply.sent.statusCode).toBe(401);
    expect(reply.sent.error).toBe('Unauthorized');
  });

  it('masks internal error messages in production for 500', () => {
    process.env.NODE_ENV = 'production';
    const err = createMockError('details that should not leak', 500);
    const { req, reply } = makeFakeReqReply();

    formatAndSendError(err as any, req, reply);

    expect(reply.status).toBe(500);
    expect(reply.sent.statusCode).toBe(500);
    expect(reply.sent.error).toBe('Internal Server Error');
    expect(reply.sent.message).toBe('Internal Server Error');
  });

  it('includes original message for 500 when not production', () => {
    process.env.NODE_ENV = 'development';
    const err = createMockError('detailed internal', 500);
    const { req, reply } = makeFakeReqReply();

    formatAndSendError(err as any, req, reply);

    expect(reply.status).toBe(500);
    expect(reply.sent.statusCode).toBe(500);
    expect(reply.sent.error).toBe('Internal Server Error');
    expect(reply.sent.message).toBe('detailed internal');
  });

  it('handles 403 error as Forbidden', () => {
    const err = createMockError('Insufficient permissions', 403);
    const { req, reply } = makeFakeReqReply('auth-corr');

    formatAndSendError(err as any, req, reply);

    expect(reply.status).toBe(403);
    expect(reply.sent.statusCode).toBe(403);
    expect(reply.sent.error).toBe('Forbidden');
    expect(reply.sent.correlationId).toBe('auth-corr');
  });

  it('maps various status codes to correct error names', () => {
    const cases: Array<[number, string]> = [
      [403, 'Forbidden'],
      [404, 'Not Found'],
      [409, 'Conflict'],
      [422, 'Unprocessable Entity'],
      [429, 'Too Many Requests'],
      [502, 'Bad Gateway'],
      [504, 'Gateway Timeout']
    ];

    for (const [status, name] of cases) {
      const err = createMockError('x', status);
      const { req, reply } = makeFakeReqReply();
      formatAndSendError(err as any, req, reply);
      expect(reply.status).toBe(status);
      expect(reply.sent.statusCode).toBe(status);
      expect(reply.sent.error).toBe(name);
    }
  });

  it('uses Node.js http.STATUS_CODES for all status codes including 418', () => {
    const err = createMockError('teapot', 418); // I'm a Teapot (RFC 2324)
    const { req, reply } = makeFakeReqReply();
    formatAndSendError(err, req, reply);
    expect(reply.status).toBe(418);
    expect(reply.sent.statusCode).toBe(418);
    expect(reply.sent.error).toBe("I'm a Teapot"); 
  });

  it('returns generic "Error" for truly unknown status codes', () => {
    const err = createMockError('custom', 999); // Not a standard HTTP status code
    const { req, reply } = makeFakeReqReply();
    formatAndSendError(err, req, reply);
    expect(reply.status).toBe(999);
    expect(reply.sent.statusCode).toBe(999);
    expect(reply.sent.error).toBe('Error');
  });

  it('handleError with service context preserves status code and logs service details', () => {
    const { req, reply } = makeFakeReqReply();
    const svc: any = { name: 'user-service', upstream: 'http://localhost:9001' };
    const upstreamErr: any = new Error('upstream boom');
    upstreamErr.statusCode = 502; // Bad Gateway from upstream

    handleError(upstreamErr as any, req as any, reply as any, svc);

    expect(reply.status).toBe(502); // Preserves original status code
    expect(reply.sent).toHaveProperty('statusCode', 502);
    expect(reply.sent.error).toBe('Bad Gateway');
  });

  it('handleError without service context wraps non-fastify errors into 500', () => {
    const { req, reply } = makeFakeReqReply();
    const plainErr: any = { message: 'oops' };

    handleError(plainErr as any, req as any, reply as any);

    expect(reply.status).toBe(500);
    expect(reply.sent.statusCode).toBe(500);
    expect(reply.sent.message).toBe('oops');
  });

  it('handleError without service passes through FastifyError with statusCode', () => {
    const { req, reply } = makeFakeReqReply();
    const fastifyErr: any = new Error('not found');
    fastifyErr.statusCode = 404;

    handleError(fastifyErr as any, req as any, reply as any);

    expect(reply.status).toBe(404);
    expect(reply.sent.statusCode).toBe(404);
    expect(reply.sent.error).toBe('Not Found');
    expect(reply.sent.message).toBe('not found');
  });

  it('setupProxyErrorHandler registers error handler on fastify instance', () => {
    const fastify: any = {
      setErrorHandler: vi.fn()
    };

    setupProxyErrorHandler(fastify);

    expect(fastify.setErrorHandler).toHaveBeenCalledTimes(1);
    expect(typeof fastify.setErrorHandler.mock.calls[0][0]).toBe('function');
  });

  it('setupProxyErrorHandler handles proxy errors when service is found', () => {
    const fastify: any = {
      setErrorHandler: vi.fn()
    };

    setupProxyErrorHandler(fastify);

    const errorHandlerFn = fastify.setErrorHandler.mock.calls[0][0];

    const { req, reply } = makeFakeReqReply();
    reply.sent = undefined; // Ensure reply is not already sent
    const err: any = new Error('upstream failed');

    errorHandlerFn(err, req, reply);

    expect(reply.sent).toBeDefined();
  });

  it('setupProxyErrorHandler does not handle error when reply is already sent', () => {
    const fastify: any = {
      setErrorHandler: vi.fn()
    };

    setupProxyErrorHandler(fastify);

    const errorHandlerFn = fastify.setErrorHandler.mock.calls[0][0];

    const { req, reply } = makeFakeReqReply();
    const originalSent = { some: 'data' };
    reply.sent = originalSent; // Reply is already sent
    const err: any = new Error('upstream failed');

    errorHandlerFn(err, req, reply);

    expect(reply.sent).toBe(originalSent);
  });

  it('setupProxyErrorHandler handles errors with service context and preserves status code', async () => {
    vi.doMock('../../../src/api-gateway/src/config', () => ({
      config: {
        services: [
          { name: 'user-service', upstream: 'http://localhost:9001', prefix: '/api/users', rewritePrefix: 'users' }
        ]
      }
    }));

    const fastify: any = {
      setErrorHandler: vi.fn()
    };

    const { setupProxyErrorHandler: setupWithMock } = await import('../../../src/api-gateway/src/routes/errorHandler');
    setupWithMock(fastify);

    const errorHandlerFn = fastify.setErrorHandler.mock.calls[0][0];

    const { req, reply } = makeFakeReqReply();
    reply.sent = undefined;
    req.url = '/api/users/123';
    const err: any = new Error('upstream failed');
    err.statusCode = 502; // Bad Gateway from upstream

    errorHandlerFn(err, req, reply);

    // Should preserve the 502 status code, not convert to 503
    expect(reply.status).toBe(502);
    expect(reply.sent).toBeDefined();
    expect(reply.sent.error).toBe('Bad Gateway');
  });

});

describe('Error Sanitization in Production', () => {
  let oldEnv: string | undefined;

  beforeEach(() => {
    oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    process.env.NODE_ENV = oldEnv;
  });

  it('sanitizes 401 authentication errors with sensitive keywords', () => {
    const err = createMockError('JWT token expired at 2024-01-15', 401);
    const { req, reply } = makeFakeReqReply();

    formatAndSendError(err, req, reply);

    expect(reply.status).toBe(401);
    expect(reply.sent.message).toBe('Authentication required');
    expect(reply.sent.message).not.toContain('JWT');
    expect(reply.sent.message).not.toContain('token');
  });

  it('allows safe 401 error messages without sensitive keywords', () => {
    const err = createMockError('Invalid credentials', 401);
    const { req, reply } = makeFakeReqReply();

    formatAndSendError(err, req, reply);

    expect(reply.status).toBe(401);
    expect(reply.sent.message).toBe('Invalid credentials');
  });

  it('sanitizes 403 authorization errors with sensitive keywords', () => {
    const err = createMockError('User role admin required, got user', 403);
    const { req, reply } = makeFakeReqReply();

    formatAndSendError(err, req, reply);

    expect(reply.status).toBe(403);
    expect(reply.sent.message).toBe('Access denied');
    expect(reply.sent.message).not.toContain('role');
    expect(reply.sent.message).not.toContain('admin');
  });

  it('allows safe 403 error messages without sensitive keywords', () => {
    const err = createMockError('Insufficient permissions', 403);
    const { req, reply } = makeFakeReqReply();

    formatAndSendError(err, req, reply);

    expect(reply.status).toBe(403);
    expect(reply.sent.message).toBe('Insufficient permissions');
  });

  it('sanitizes database errors in 400 responses', () => {
    const err = createMockError('Duplicate key violation on column user_email in table users', 400);
    const { req, reply } = makeFakeReqReply();

    formatAndSendError(err, req, reply);

    expect(reply.status).toBe(400);
    expect(reply.sent.message).toBe('Invalid request');
    expect(reply.sent.message).not.toContain('column');
    expect(reply.sent.message).not.toContain('table');
  });

  it('sanitizes SQL errors in 422 responses', () => {
    const err = createMockError('Foreign key constraint failed on user_id:', 422);
    const { req, reply } = makeFakeReqReply();

    formatAndSendError(err, req, reply);

    expect(reply.status).toBe(422);
    expect(reply.sent.message).toBe('Invalid request');
    expect(reply.sent.message).not.toContain('foreign key');
  });

  it('allows safe 400 errors without schema details', () => {
    const err = createMockError('Email is required', 400);
    const { req, reply } = makeFakeReqReply();

    formatAndSendError(err, req, reply);

    expect(reply.status).toBe(400);
    expect(reply.sent.message).toBe('Email is required');
  });

  it('sanitizes specific 5xx errors (500, 502, 504)', () => {
    const testCases = [
      { code: 500, message: 'Database connection failed' },
      { code: 502, message: 'Upstream service returned invalid response' },
      { code: 504, message: 'Gateway timeout after 30s' }
    ];

    testCases.forEach(({ code, message }) => {
      const err = createMockError(message, code);
      const { req, reply } = makeFakeReqReply();

      formatAndSendError(err, req, reply);

      expect(reply.status).toBe(code);
      expect(reply.sent.message).toBe('Internal Server Error');
    });
  });

  it('preserves 503 errors to maintain ServiceUnavailableError messages', () => {
    const err = createMockError('user-service is currently unavailable', 503);
    const { req, reply } = makeFakeReqReply();

    formatAndSendError(err, req, reply);

    expect(reply.status).toBe(503);
    expect(reply.sent.message).toBe('user-service is currently unavailable');
  });

  it('does not sanitize in development mode', () => {
    process.env.NODE_ENV = 'development';

    const err = createMockError('Detailed error with table name users', 400);
    const { req, reply } = makeFakeReqReply();

    formatAndSendError(err, req, reply);

    expect(reply.status).toBe(400);
    expect(reply.sent.message).toBe('Detailed error with table name users');
    expect(reply.sent.message).toContain('table');
  });

  it('sanitizes errors with database keyword variations', () => {
    const sensitiveMessages = [
      'Error in SQL query: SELECT * FROM users',
      'Table constraint violation',
      'Primary key already exists',
      'Unique key constraint failed',
      'Schema validation error for user model'
    ];

    sensitiveMessages.forEach(message => {
      const err = createMockError(message, 400);
      const { req, reply } = makeFakeReqReply();

      formatAndSendError(err, req, reply);

      expect(reply.sent.message).toBe('Invalid request');
    });
  });
});