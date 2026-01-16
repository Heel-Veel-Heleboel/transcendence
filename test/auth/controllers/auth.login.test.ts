import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthController } from '../../../src/auth/src/controllers/auth';

const MockAuthService = {
  register: vi.fn(),
  login: vi.fn()
};

const MockReply = {
  code: vi.fn().mockReturnThis(),
  send: vi.fn()
};

describe('Should login user successfuly.', () => {

  let authController: AuthController;

  beforeEach(() => {
    vi.clearAllMocks();
    authController = new AuthController(MockAuthService as any);
  });


  it('Should successfuly login the user',  async () => {

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
      token: 'sometoken',
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
  });

  
});