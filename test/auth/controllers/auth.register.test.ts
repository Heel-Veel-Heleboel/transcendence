import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthController } from '../../../src/auth/src/controllers/auth.js';

describe('AuthController - register', () => {
  const MockAuthService = {
    register: vi.fn()
  };

  const MockReply = {
    code: vi.fn().mockReturnThis(),
    send: vi.fn()
  };

  let authController: any;
  let mockRequest: any;

  beforeEach(() => {
    vi.clearAllMocks();
    authController = new AuthController(MockAuthService as any);
    mockRequest = {
      body: {},
      log: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      }
    };
  });
  it('Should register a new user and return SafeUserDto', async () => {
    mockRequest.body = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'securepassword'
    };

  it('should register a new user and return SafeUserDto', async () => {
    mockRequest.body = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'securepassword'
    };
    const mockUser = {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com'
    };
    MockAuthService.register.mockResolvedValueOnce(mockUser);

    await authController.register(mockRequest, MockReply as any);

    expect(MockAuthService.register).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'securepassword'
    });
    expect(MockReply.code).toHaveBeenCalledWith(201);
    expect(MockReply.send).toHaveBeenCalledWith(mockUser);
    expect(mockRequest.log.info).toHaveBeenCalledWith(
      { email: mockRequest.body.email },
      'Registration attempt'
    );
    expect(mockRequest.log.info).toHaveBeenCalledWith(
      { userId: mockUser.id },
      'User registered successfully'
    );
  });

  it('Should handle errors during registration', async () => {
    mockRequest.body = {
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      password: 'anotherpassword'
    };

    const mockError = new Error('Registration failed');
    MockAuthService.register.mockRejectedValueOnce(mockError);

    await expect(authController.register(mockRequest, MockReply as any)).rejects.toThrow('Registration failed');

    expect(MockAuthService.register).toHaveBeenCalledWith({
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      password: 'anotherpassword'
    });
    expect(MockReply.code).not.toHaveBeenCalled();
    expect(MockReply.send).not.toHaveBeenCalled();
    expect(mockRequest.log.info).toHaveBeenCalledWith(
      { email: mockRequest.body.email },
      'Registration attempt'
    );
    expect(mockRequest.log.info).not.toHaveBeenCalledWith(
      expect.objectContaining({ userId: expect.anything() }),
      'User registered successfully'
    );
  });
});