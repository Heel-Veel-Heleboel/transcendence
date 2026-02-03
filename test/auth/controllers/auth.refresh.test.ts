import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthController } from '../../../src/auth/src/controllers/auth.js';
import { RefreshedTokensDto } from '../../../src/auth/src/types/dtos/auth.js';

vi.mock('../../../src/auth/src/config/jwt.js', () => ({
  getJwtConfig: vi.fn(() => ({
    expirationRefreshToken: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  }))
}));

const MockAuthService = {
  refresh: vi.fn()
};

const MockReply = {
  code: vi.fn().mockReturnThis(),
  setCookie: vi.fn().mockReturnThis(),
  cookies: {} ,
  send: vi.fn()
};

describe('AuthController - refresh', () => {
  let authController: AuthController;

  beforeEach(() => {
    vi.clearAllMocks();
    authController = new AuthController(MockAuthService as any);
  });

  it('Should refresh tokens and return RefreshedTokensDto', async () => {
    const mockRequest = {
      body: {
        user_id: 1
      },
      cookies: {
        refresh_token: 'old-refresh-token'
      },
      log: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      }
    } as any;

    const mockTokens: RefreshedTokensDto = {
      access_token: 'new-access-token',
      new_refresh_token: 'new-refresh-token'
    };

    MockAuthService.refresh.mockResolvedValueOnce(mockTokens);

    await authController.refresh(mockRequest, MockReply as any);

    expect(MockAuthService.refresh).toHaveBeenCalledWith({ user_id: 1 }, 'old-refresh-token');
    expect(MockReply.code).toHaveBeenCalledWith(200);
    // Should send only access_token (new_refresh_token is in cookie)
    expect(MockReply.send).toHaveBeenCalledWith({ access_token: 'new-access-token' });
    expect(MockReply.setCookie).toHaveBeenCalledWith('refresh_token', 'new-refresh-token', expect.objectContaining({
      httpOnly: true,
      sameSite: 'strict',
      path: '/auth',
      maxAge: expect.any(Number)
    }));
    expect(mockRequest.log.info).toHaveBeenCalledWith(
      { user_id: mockRequest.body.user_id },
      'Token refresh attempt'
    );
    expect(mockRequest.log.info).toHaveBeenCalledWith(
      { user_id: mockRequest.body.user_id },
      'Tokens refreshed successfully'
    );
  });

  it('Should propagate errors from AuthService.refresh', async () => {
    const mockRequest = {
      body: {
        user_id: 2
      },
      cookies: {
        refresh_token: 'bad-token'
      },
      log: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      }
    } as any;

    const error = new Error('Refresh failed');
    MockAuthService.refresh.mockRejectedValueOnce(error);

    await expect(authController.refresh(mockRequest, MockReply as any)).rejects.toThrow('Refresh failed');
    expect(MockReply.code).not.toHaveBeenCalled();
    expect(MockReply.send).not.toHaveBeenCalled();
    expect(mockRequest.log.info).toHaveBeenCalledWith(
      { user_id: mockRequest.body.user_id },
      'Token refresh attempt'
    );
    expect(mockRequest.log.info).not.toHaveBeenCalledWith(
      { user_id: mockRequest.body.user_id },
      'Tokens refreshed successfully'
    );
  });

  it('Should set new refresh_token cookie with correct security settings', async () => {
    const mockRequest = {
      body: {
        user_id: 5
      },
      cookies: {
        refresh_token: 'current-refresh-token'
      },
      log: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      }
    } as any;

    const mockTokens = {
      access_token: 'new.access.token',
      new_refresh_token: 'brand-new-refresh-token'
    };

    MockAuthService.refresh.mockResolvedValueOnce(mockTokens);
    await authController.refresh(mockRequest, MockReply as any);

    expect(MockReply.setCookie).toHaveBeenCalledTimes(1);
    expect(MockReply.setCookie).toHaveBeenCalledWith(
      'refresh_token',
      'brand-new-refresh-token',
      expect.objectContaining({
        httpOnly: true,
        path: '/auth',
        sameSite: 'strict',
        secure: false,
        maxAge: expect.any(Number)
      })
    );
  });

  it('Should return 400 when refresh_token cookie is missing', async () => {
    const mockRequest = {
      body: {
        user_id: 6
      },
      cookies: {}, // No refresh_token cookie
      log: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      }
    } as any;

    await authController.refresh(mockRequest, MockReply as any);

    expect(MockReply.code).toHaveBeenCalledWith(400);
    expect(MockReply.send).toHaveBeenCalledWith({ message: 'Refresh token cookie is missing' });
    expect(MockAuthService.refresh).not.toHaveBeenCalled();
    expect(MockReply.setCookie).not.toHaveBeenCalled();
  });

  it('Should NOT include new_refresh_token in response body', async () => {
    const mockRequest = {
      body: {
        user_id: 7
      },
      cookies: {
        refresh_token: 'old-token'
      },
      log: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      }
    } as any;

    const mockTokens = {
      access_token: 'fresh.access.token',
      new_refresh_token: 'fresh-refresh-token'
    };

    MockAuthService.refresh.mockResolvedValueOnce(mockTokens);
    await authController.refresh(mockRequest, MockReply as any);

    // Response should only contain access_token
    expect(MockReply.send).toHaveBeenCalledWith({ access_token: 'fresh.access.token' });
    expect(MockReply.send).toHaveBeenCalledWith(
      expect.not.objectContaining({ new_refresh_token: expect.anything() })
    );
  });

  it('Should read refresh_token from cookies and pass to service', async () => {
    const mockRequest = {
      body: {
        user_id: 8
      },
      cookies: {
        refresh_token: 'cookie-stored-token'
      },
      log: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      }
    } as any;

    const mockTokens = {
      access_token: 'access.token',
      new_refresh_token: 'new.refresh.token'
    };

    MockAuthService.refresh.mockResolvedValueOnce(mockTokens);
    await authController.refresh(mockRequest, MockReply as any);

    expect(MockAuthService.refresh).toHaveBeenCalledWith(
      { user_id: 8 },
      'cookie-stored-token'
    );
  });
});