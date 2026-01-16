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

  beforeEach(() => {
    vi.clearAllMocks();
    authController = new AuthController(MockAuthService as any);
  });


  it('Should successfully login the user',  async () => {

    const mockRequest = {
      body: {
        email: 'john.doe@example.com',
        password: 'securepassword'
      }
    } as any;

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
  });

  it('Should handle errors during login', async () => {
    const mockRequest = {
      body: {
        email: 'john.doe@example.com',
        password: 'securepassword'
      }
    } as any;
    
    const mockError = new Error('Login failed');
    MockAuthService.login.mockRejectedValueOnce(mockError);
    
    await expect(authController.login(mockRequest, MockReply as any)).rejects.toThrow('Login failed');
    expect(MockAuthService.login).toHaveBeenCalledWith({
      email: 'john.doe@example.com',
      password: 'securepassword'
    });
    expect(MockReply.code).not.toHaveBeenCalled();
    expect(MockReply.send).not.toHaveBeenCalled();
  });


});