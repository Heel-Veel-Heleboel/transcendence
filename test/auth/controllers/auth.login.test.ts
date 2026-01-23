import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthController } from '../../../src/auth/src/controllers/auth.js';

const MockAuthService = {
  login: vi.fn()
};

const MockReply = {
  code: vi.fn().mockReturnThis(),
  send: vi.fn()
};

describe('AuthController - login', () => {
  let authController: AuthController;
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

  it('Should successfully login the user', async () => {
    mockRequest.body = {
      email: 'john.doe@example.com',
      password: 'securepassword'
    };

    const mockLoggedInUser = {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      accessToken: 'sometoken',
      refreshToken: 'somerefreshtoken'
    };

    MockAuthService.login.mockResolvedValueOnce(mockLoggedInUser);
    await authController.login(mockRequest, MockReply as any);

    expect(MockAuthService.login).toHaveBeenCalledWith({
      email: 'john.doe@example.com',
      password: 'securepassword'
    });
    expect(MockReply.code).toHaveBeenCalledWith(200);
    expect(MockReply.send).toHaveBeenCalledWith(mockLoggedInUser);
    expect(mockRequest.log.info).toHaveBeenCalledWith(
      { body: mockRequest.body },
      'Login attempt'
    );
    expect(mockRequest.log.info).toHaveBeenCalledWith(
      { userId: mockLoggedInUser.id },
      'User logged in successfully'
    );
  });

  it('Should handle errors during login', async () => {
    mockRequest.body = {
      email: 'john.doe@example.com',
      password: 'securepassword'
    };

    const mockError = new Error('Login failed');
    MockAuthService.login.mockRejectedValueOnce(mockError);

    await expect(authController.login(mockRequest, MockReply as any)).rejects.toThrow('Login failed');
    expect(MockAuthService.login).toHaveBeenCalledWith({
      email: 'john.doe@example.com',
      password: 'securepassword'
    });
    expect(MockReply.code).not.toHaveBeenCalled();
    expect(MockReply.send).not.toHaveBeenCalled();
    expect(mockRequest.log.info).toHaveBeenCalledWith(
      { body: mockRequest.body },
      'Login attempt'
    );
    expect(mockRequest.log.info).not.toHaveBeenCalledWith(
      expect.objectContaining({ userId: expect.anything() }),
      'User logged in successfully'
    );
  });
});