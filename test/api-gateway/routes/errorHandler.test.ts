import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { errorHandler, ValidationError, ServiceUnavailableError, AuthenticationError, AuthorizationError, handleProxyError, handleGenericError } from '../../../src/api-gateway/src/routes/errorHandler';

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

describe('errorHandler', () => {
  let oldEnv: string | undefined;

  beforeEach(() => {
    oldEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = oldEnv;
    vi.resetAllMocks();
  });

  it('handles ValidationError as 400 with proper name', () => {
    const err = new ValidationError('invalid payload');
    const { req, reply } = makeFakeReqReply('corr-1');

    errorHandler(err as any, req, reply);

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

    errorHandler(err as any, req, reply);

    expect(reply.status).toBe(503);
    expect(reply.sent.statusCode).toBe(503);
    expect(reply.sent.error).toBe('Service Unavailable');
    expect(reply.sent.message).toContain('user-service');
  });

  it('handles AuthenticationError as 401', () => {
    const err = new AuthenticationError();
    const { req, reply } = makeFakeReqReply();

    errorHandler(err as any, req, reply);

    expect(reply.status).toBe(401);
    expect(reply.sent.statusCode).toBe(401);
    expect(reply.sent.error).toBe('Unauthorized');
  });

  it('masks internal error messages in production for 500', () => {
    process.env.NODE_ENV = 'production';
    const err = new Error('details that should not leak');
    const { req, reply } = makeFakeReqReply();

    // simulate no statusCode on the error
    errorHandler(err as any, req, reply);

    expect(reply.status).toBe(500);
    expect(reply.sent.statusCode).toBe(500);
    expect(reply.sent.error).toBe('Internal Server Error');
    expect(reply.sent.message).toBe('Internal Server Error');
  });

  it('includes original message for 500 when not production', () => {
    process.env.NODE_ENV = 'development';
    const err = new Error('detailed internal');
    const { req, reply } = makeFakeReqReply();

    errorHandler(err as any, req, reply);

    expect(reply.status).toBe(500);
    expect(reply.sent.statusCode).toBe(500);
    expect(reply.sent.error).toBe('Internal Server Error');
    expect(reply.sent.message).toBe('detailed internal');
  });

  it('handles AuthorizationError as 403', () => {
    const err = new AuthorizationError();
    const { req, reply } = makeFakeReqReply('auth-corr');

    errorHandler(err as any, req, reply);

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
      const err: any = new Error('x');
      err.statusCode = status;
      const { req, reply } = makeFakeReqReply();
      errorHandler(err as any, req, reply);
      expect(reply.status).toBe(status);
      expect(reply.sent.statusCode).toBe(status);
      expect(reply.sent.error).toBe(name);
    }
  });

  it('returns generic "Error" for unknown status codes', () => {
    const err: any = new Error('teapot');
    err.statusCode = 418; // not defined in mapping
    const { req, reply } = makeFakeReqReply();
    errorHandler(err as any, req, reply);
    expect(reply.status).toBe(418);
    expect(reply.sent.statusCode).toBe(418);
    expect(reply.sent.error).toBe('Error');
  });

  it('handleProxyError creates ServiceUnavailableError and triggers errorHandler', () => {
    const { req, reply } = makeFakeReqReply();
    const svc: any = { name: 'user-service', upstream: 'http://localhost:9001' };
    const upstreamErr: any = new Error('upstream boom');

    handleProxyError(upstreamErr as any, svc as any, req as any, reply as any);

    expect(reply.status).toBe(503);
    expect(reply.sent).toHaveProperty('statusCode', 503);
    expect(String(reply.sent.message)).toContain('user-service');
  });

  it('handleGenericError wraps non-fastify errors into 500', () => {
    const { req, reply } = makeFakeReqReply();
    const plainErr: any = { message: 'oops' };

    handleGenericError(plainErr as any, req as any, reply as any);

    expect(reply.status).toBe(500);
    expect(reply.sent.statusCode).toBe(500);
    expect(reply.sent.message).toBe('oops');
  });

});