import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthController } from '../../../src/auth/src/controllers/auth.js';


const MockAuthService = {
  register: vi.fn()
};

const MockReply = {
  code: vi.fn().mockReturnThis(),
  send: vi.fn()
};

describe('AuthController - register', () => {
  let authController: AuthController;

  beforeEach(() => {
    vi.clearAllMocks();
    authController = new AuthController(MockAuthService as any);
  });

  it ('should register a new user and return SafeUserDto', async () => {
    const mockRequest = {
      body: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'securepassword'
      }
    } as any;

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
  });

  it ('Should handle errors during registration', async () => {
    const mockRequest = {
      body: {
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        password: 'anotherpassword'
      }
    } as any;

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
  });
});