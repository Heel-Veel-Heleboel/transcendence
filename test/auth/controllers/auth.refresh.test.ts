import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthController } from '../../../src/auth/src/controllers/auth.js';
import { RefreshDto, RefreshedTokensDto } from '../../../src/auth/src/types/dtos/auth.js';

const MockAuthService = {
  refresh: vi.fn()
};

const MockReply = {
  code: vi.fn().mockReturnThis(),
  send: vi.fn()
};

describe('AuthController - refresh', () => {
  let authController: AuthController;

  beforeEach(() => {
    vi.clearAllMocks();
    authController = new AuthController(MockAuthService as any);
  });

  it('should refresh tokens and return RefreshedTokensDto', async () => {
    const mockRequest = {
      body: {
        userId: 1,
        refreshToken: 'refresh-token'
      }
    } as any;

    const mockTokens: RefreshedTokensDto = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token'
    };

    MockAuthService.refresh.mockResolvedValueOnce(mockTokens);

    await authController.refresh(mockRequest, MockReply as any);

    expect(MockAuthService.refresh).toHaveBeenCalledWith(mockRequest.body);
    expect(MockReply.code).toHaveBeenCalledWith(200);
    expect(MockReply.send).toHaveBeenCalledWith(mockTokens);
  });

  it('should propagate errors from AuthService.refresh', async () => {
    const mockRequest = {
      body: {
        userId: 2,
        refreshToken: 'bad-token'
      }
    } as any;

    const error = new Error('Refresh failed');
    MockAuthService.refresh.mockRejectedValueOnce(error);

    await expect(authController.refresh(mockRequest, MockReply as any)).rejects.toThrow('Refresh failed');
    expect(MockReply.code).not.toHaveBeenCalled();
    expect(MockReply.send).not.toHaveBeenCalled();
  });
});