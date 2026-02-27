import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authErrorHandler } from '../../src/middleware/error-handler.js';
import { AuthenticationError, AuthorizationError, ResourceNotFoundError } from '../../src/error/auth.js';

describe('authErrorHandler', () => {
  let mockRequest: any;
  let mockReply: any;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequest = { log: { error: vi.fn() } };
    mockReply = { 
      status: vi.fn().mockReturnThis(), 
      code: vi.fn().mockReturnThis(), 
      send: vi.fn() 
    };
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('handles AuthenticationError', () => {
    const error = new AuthenticationError('no auth');
    authErrorHandler(error as any, mockRequest as any, mockReply as any);

    expect(mockRequest.log.error).toHaveBeenCalledWith({ err: error }, 'Authentication/Authorization error occurred');
    expect(mockReply.status).toHaveBeenCalledWith(401);
    expect(mockReply.send).toHaveBeenCalledWith({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'no auth'
    });
  });

  it('handles AuthorizationError', () => {
    const error = new AuthorizationError('forbidden');
    authErrorHandler(error as any, mockRequest as any, mockReply as any);

    expect(mockRequest.log.error).toHaveBeenCalledWith({ err: error }, 'Authentication/Authorization error occurred');
    expect(mockReply.status).toHaveBeenCalledWith(403);
    expect(mockReply.send).toHaveBeenCalledWith({
      statusCode: 403,
      error: 'Forbidden',
      message: 'forbidden'
    });
  });

  it('handles ResourceNotFoundError', () => {
    const error = new ResourceNotFoundError('not found');
    authErrorHandler(error as any, mockRequest as any, mockReply as any);

    expect(mockRequest.log.error).toHaveBeenCalledWith({ err: error }, 'Authentication/Authorization error occurred');
    expect(mockReply.status).toHaveBeenCalledWith(404);
    expect(mockReply.send).toHaveBeenCalledWith({
      statusCode: 404,
      error: 'Not Found',
      message: 'not found'
    });
  });

  it('handles validation error and returns details', () => {
    const validation = [{ instancePath: '/email', message: 'must be email' }];
    const error = { validation };
    authErrorHandler(error as any, mockRequest as any, mockReply as any);

    expect(mockRequest.log.error).toHaveBeenCalledWith({ err: error }, 'Authentication/Authorization error occurred');
    expect(mockReply.code).toHaveBeenCalledWith(400);
    expect(mockReply.send).toHaveBeenCalledWith({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation error occurred',
      details: [{ path: 'email', message: 'must be email' }]
    });
  });

  it('handles generic error in non-production (shows original message)', () => {
    process.env.NODE_ENV = 'development';
    const error = new Error('something broke');
    authErrorHandler(error as any, mockRequest as any, mockReply as any);

    expect(mockRequest.log.error).toHaveBeenCalledWith({ err: error }, 'Authentication/Authorization error occurred');
    expect(mockReply.status).toHaveBeenCalledWith(500);
    expect(mockReply.send).toHaveBeenCalledWith({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'something broke'
    });
  });

  it('handles generic error in production (hides message)', () => {
    process.env.NODE_ENV = 'production';
    const error = new Error('secret details');
    authErrorHandler(error as any, mockRequest as any, mockReply as any);

    expect(mockRequest.log.error).toHaveBeenCalledWith({ err: error }, 'Authentication/Authorization error occurred');
    expect(mockReply.status).toHaveBeenCalledWith(500);
    expect(mockReply.send).toHaveBeenCalledWith({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  });
});