import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthController } from '../../src/controllers/auth';

vi.mock('../../src/config/jwt.js', () => ({
  getJwtConfig: vi.fn(() => ({
    expirationRefreshToken: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  }))
}));

const MockAuthService = {
  login: vi.fn()
};

const MockReply = {
  code: vi.fn().mockReturnThis(),
  setCookie: vi.fn().mockReturnThis(),
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
      access_token: 'sometoken',
      refresh_token: 'somerefreshtoken'
    };

    MockAuthService.login.mockResolvedValueOnce(mockLoggedInUser);
    await authController.login(mockRequest, MockReply as any);

    expect(MockAuthService.login).toHaveBeenCalledWith({
      email: 'john.doe@example.com',
      password: 'securepassword'
    });
    expect(MockReply.code).toHaveBeenCalledWith(200);
    // Should send user data without refresh_token
    expect(MockReply.send).toHaveBeenCalledWith({
      id: mockLoggedInUser.id,
      name: mockLoggedInUser.name,
      email: mockLoggedInUser.email,
      access_token: mockLoggedInUser.access_token
    });
    expect(MockReply.setCookie).toHaveBeenCalledWith(
      'refresh_token',
      mockLoggedInUser.refresh_token,
      expect.objectContaining({
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: expect.any(Number),
        path: '/'
      })
    );
    expect(mockRequest.log.info).toHaveBeenCalledWith(
      { email: mockRequest.body.email },
      'Login attempt'
    );
    expect(mockRequest.log.info).toHaveBeenCalledWith(
      { user_id: mockLoggedInUser.id },
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

    await expect(
      authController.login(mockRequest, MockReply as any)
    ).rejects.toThrow('Login failed');
    expect(MockAuthService.login).toHaveBeenCalledWith({
      email: 'john.doe@example.com',
      password: 'securepassword'
    });
    expect(MockReply.code).not.toHaveBeenCalled();
    expect(MockReply.send).not.toHaveBeenCalled();
    expect(MockReply.setCookie).not.toHaveBeenCalled();
    expect(mockRequest.log.info).toHaveBeenCalledWith(
      { email: mockRequest.body.email },
      'Login attempt'
    );
    expect(mockRequest.log.info).not.toHaveBeenCalledWith(
      expect.objectContaining({ user_id: expect.anything() }),
      'User logged in successfully'
    );
  });

  it('Should set refresh_token cookie with correct security settings', async () => {
    mockRequest.body = {
      email: 'test@example.com',
      password: 'password123'
    };

    const mockLoggedInUser = {
      id: 5,
      name: 'Test User',
      email: 'test@example.com',
      access_token: 'access.token.here',
      refresh_token: 'refresh-token-value'
    };

    MockAuthService.login.mockResolvedValueOnce(mockLoggedInUser);
    await authController.login(mockRequest, MockReply as any);

    expect(MockReply.setCookie).toHaveBeenCalledTimes(1);
    expect(MockReply.setCookie).toHaveBeenCalledWith(
      'refresh_token',
      'refresh-token-value',
      expect.objectContaining({
        httpOnly: true,
        path: '/',
        sameSite: 'strict',
        secure: false, // process.env.NODE_ENV !== 'production'
        maxAge: expect.any(Number)
      })
    );
  });

  it('Should NOT include refresh_token in response body', async () => {
    mockRequest.body = {
      email: 'user@example.com',
      password: 'mypassword'
    };

    const mockLoggedInUser = {
      id: 10,
      name: 'Another User',
      email: 'user@example.com',
      access_token: 'some.access.token',
      refresh_token: 'some-refresh-token'
    };

    MockAuthService.login.mockResolvedValueOnce(mockLoggedInUser);
    await authController.login(mockRequest, MockReply as any);

    // Verify response does NOT contain refresh_token
    expect(MockReply.send).toHaveBeenCalledWith(
      expect.not.objectContaining({ refresh_token: expect.anything() })
    );

    // Verify response contains other fields
    expect(MockReply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 10,
        name: 'Another User',
        email: 'user@example.com',
        access_token: 'some.access.token'
      })
    );
  });
});

