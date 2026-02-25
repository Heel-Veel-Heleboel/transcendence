import { it, expect, describe, vi, beforeEach} from 'vitest';
import { errorHandler } from '../../src/middleware/error-handler.js';
import * as UserErrors from '../../src/error/user.js';
import { UserDomainErrorMessages, CommonErrorMessages } from '../../src/constants/error-messages.js';

describe('ErrorHandler', () => {
  const mockRequest = {
    log: {
      error: vi.fn()
    }
  } as any;

  const mockReply = {
    code: vi.fn().mockReturnThis(),
    send: vi.fn()
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle UserAlreadyExistsError for email', () => {
    const error = new UserErrors.UserAlreadyExistsError('email');
    errorHandler(error, mockRequest, mockReply);
    expect(mockReply.code).toHaveBeenCalledWith(409);
    expect(mockReply.send).toHaveBeenCalledWith({
      statusCode: 409,
      error: 'Conflict',
      message: UserDomainErrorMessages.EMAIL_ALREADY_EXISTS
    });
  });

  it('should handle UserAlreadyExistsError for name', () => {
    const error = new UserErrors.UserAlreadyExistsError('name');
    errorHandler(error, mockRequest, mockReply);
    expect(mockReply.code).toHaveBeenCalledWith(409);
    expect(mockReply.send).toHaveBeenCalledWith({
      statusCode: 409,
      error: 'Conflict',
      message: UserDomainErrorMessages.NAME_ALREADY_EXISTS
    });
  });

  it('should handle UserNotFoundError', () => {
    const error = new UserErrors.UserNotFoundError();
    errorHandler(error, mockRequest, mockReply);
    expect(mockReply.code).toHaveBeenCalledWith(404);
    expect(mockReply.send).toHaveBeenCalledWith({
      statusCode: 404,
      error: 'Not Found',
      message: UserDomainErrorMessages.USER_NOT_FOUND
    });
  });

  it('should handle DatabaseError', () => {
    const error = new UserErrors.DatabaseError();
    errorHandler(error, mockRequest, mockReply);
    expect(mockReply.code).toHaveBeenCalledWith(500);
    expect(mockReply.send).toHaveBeenCalledWith({
      statusCode: 500,
      error: 'Internal Server Error',
      message: CommonErrorMessages.DATABASE_ERROR
    });
  });

  it('should handle generic errors', () => {
    const error = new Error('Generic error');
    errorHandler(error, mockRequest, mockReply);
    expect(mockReply.code).toHaveBeenCalledWith(500);
    expect(mockReply.send).toHaveBeenCalledWith({
      statusCode: 500,
      error: 'Internal Server Error',
      message: CommonErrorMessages.INTERNAL_SERVER_ERROR
    });
  });
});