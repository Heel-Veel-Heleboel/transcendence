import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthController } from '../../../src/auth/src/controllers/auth.js';
import { RefreshedTokensDto } from '../../../src/auth/src/types/dtos/auth.js';

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

  it('Should refresh tokens and return RefreshedTokensDto', async () => {
    const mockRequest = {
      body: {
        user_id: 1,
        refresh_token: 'refresh-token'
      },
      log: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      }
    } as any;

    const mockTokens: RefreshedTokensDto = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token'
    };

    MockAuthService.refresh.mockResolvedValueOnce(mockTokens);

    await authController.refresh(mockRequest, MockReply as any);

    expect(MockAuthService.refresh).toHaveBeenCalledWith(mockRequest.body);
    expect(MockReply.code).toHaveBeenCalledWith(200);
    expect(MockReply.send).toHaveBeenCalledWith(mockTokens);
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
        user_id: 2,
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
});