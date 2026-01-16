import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthController } from '../../../src/auth/src/controllers/auth.js';

const MockAuthService = {
  logout: vi.fn()
};

const MockReply = {
  code: vi.fn().mockReturnThis(),
  send: vi.fn()
};

describe('AuthController - logout', () => {
  let authController: AuthController;

  beforeEach(() => {
    vi.clearAllMocks();
    authController = new AuthController(MockAuthService as any);
  });

  it('Should logout the user successfully', async () => {

    const mockRequest = {
      body: {
        userId: 1,
        refreshToken: 'gkhdghfsfhsfjbshjbsjhbhsbsbjdhbdbv'
      },
      log: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      }
    } as any;

    await authController.logout(mockRequest, MockReply as any);

    expect(MockAuthService.logout).toHaveBeenCalledWith({
      userId: 1,
      refreshToken: 'gkhdghfsfhsfjbshjbsjhbhsbsbjdhbdbv'
    });
    expect(MockReply.code).toHaveBeenCalledWith(204);
    expect(MockReply.send).toHaveBeenCalled();
    expect(mockRequest.log.info).toHaveBeenCalledWith(
      { body: mockRequest.body },
      'Logout attempt'
    );
    expect(mockRequest.log.info).toHaveBeenCalledWith(
      { userId: mockRequest.body.userId },
      'User logged out successfully'
    );
  });

  it('Should handle errors during logout', async () => {
    const mockRequest = {
      body: {
        userId: 2,
        refreshToken: 'invalidtokenvalue'
      },
      log: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      }
    } as any;

    const mockError = new Error('Logout failed');
    MockAuthService.logout.mockRejectedValueOnce(mockError);

    await expect(authController.logout(mockRequest, MockReply as any)).rejects.toThrow('Logout failed');

    expect(MockAuthService.logout).toHaveBeenCalledWith({
      userId: 2,
      refreshToken: 'invalidtokenvalue'
    });
    expect(MockReply.code).not.toHaveBeenCalled();
    expect(MockReply.send).not.toHaveBeenCalled();
    expect(mockRequest.log.info).toHaveBeenCalledWith(
      { body: mockRequest.body },
      'Logout attempt'
    );
    expect(mockRequest.log.info).not.toHaveBeenCalledWith(
      { userId: mockRequest.body.userId },
      'User logged out successfully'
    );
  });
});