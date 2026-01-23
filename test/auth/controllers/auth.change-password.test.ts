import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthController } from '../../../src/auth/src/controllers/auth.js';

const MockAuthService = {
  changePassword: vi.fn()
};

const MockReply = {
  code: vi.fn().mockReturnThis(),
  send: vi.fn()
};

describe('AuthController - changePassword', () => {
  let authController: AuthController;
  let mockRequest: any;

  beforeEach(() => {
    vi.clearAllMocks();
    authController = new AuthController(MockAuthService as any);
    mockRequest = {
      body: { user_id: 1, old_password: 'oldpass', new_password: 'newpass' },
      log: { info: vi.fn() }
    } as any;
  });

  it('should change password successfully and return 204', async () => {
    MockAuthService.changePassword.mockResolvedValueOnce(undefined);

    await authController.changePassword(mockRequest, MockReply as any);

    expect(MockAuthService.changePassword).toHaveBeenCalledWith(mockRequest.body);
    expect(mockRequest.log.info).toHaveBeenCalledWith({ user_id: mockRequest.body.user_id }, 'Change password attempt');
    expect(mockRequest.log.info).toHaveBeenCalledWith({ user_id: mockRequest.body.user_id }, 'Password changed successfully');
    expect(MockReply.code).toHaveBeenCalledWith(204);
    expect(MockReply.send).toHaveBeenCalled();
  });

  it('should propagate errors from service and not send a response', async () => {
    const error = new Error('Change failed');
    MockAuthService.changePassword.mockRejectedValueOnce(error);

    await expect(authController.changePassword(mockRequest, MockReply as any)).rejects.toThrow('Change failed');

    expect(MockAuthService.changePassword).toHaveBeenCalledWith(mockRequest.body);
    expect(MockReply.code).not.toHaveBeenCalled();
    expect(MockReply.send).not.toHaveBeenCalled();
    expect(mockRequest.log.info).toHaveBeenCalledWith({ user_id: mockRequest.body.user_id }, 'Change password attempt');
    expect(mockRequest.log.info).not.toHaveBeenCalledWith({ user_id: mockRequest.body.user_id }, 'Password changed successfully');
  });
});