import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { errorHandler, ValidationError, ServiceUnavailableError, AuthenticationError } from '../../../src/api-gateway/src/utils/errors';

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
});
