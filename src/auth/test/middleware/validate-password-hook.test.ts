import { it, describe, expect, beforeEach, vi } from 'vitest';
import { validatePasswordHook } from '../../src/middleware/validate-password-hook.js';
import * as PasswordValidator from '../../src/validators/password.js';
import { PasswordErrorCode } from '../../src/constants/password.js';


let MockReply: any;
beforeEach(() => {
  vi.restoreAllMocks();
  MockReply = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn()
  };
});



describe('Pre-validate password hook test for /register', () => {

  it('Should fail in case password is missing', async () => {
    const MockRequest = {
      body: {}
    };
    await validatePasswordHook(MockRequest as any, MockReply as any);
    expect(MockReply.status).toHaveBeenCalledWith(400);
    expect(MockReply.send).toHaveBeenCalledWith({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Password is required'
    });
  });


  it('Should validate a good password and should not fail', async () => {
    const MockRequest = {
      body: {
        password: 'any'
      }
    };
    vi.spyOn(PasswordValidator, 'validatePassword').mockReturnValueOnce({
      valid: true,
      messages: [],
      errors: []
    });
    await validatePasswordHook(MockRequest as any, MockReply as any);
    expect(PasswordValidator.validatePassword).toHaveBeenCalledWith(
      'any',
      expect.any(Object)
    );
    
    expect(MockReply.status).not.toHaveBeenCalled();
    expect(MockReply.send).not.toHaveBeenCalled();
  });


  it('Should fail validation for a bad password', async () => {
  
    vi.spyOn(PasswordValidator, 'validatePassword').mockReturnValueOnce({
      valid: false,
      messages: ['failed validation'],
      errors: ['PASSWORD_TOO_WEAK' as PasswordErrorCode]
    });
    const MockRequest = {
      body: {
        password: 'anything'
      }
    };
    await validatePasswordHook(MockRequest as any, MockReply as any);
    expect(PasswordValidator.validatePassword).toHaveBeenCalledWith(
      'anything',
      expect.any(Object)
    );
    expect(MockReply.status).toHaveBeenCalledWith(400);
    expect(MockReply.send).toHaveBeenCalledWith({
      statusCode: 400,
      error: 'Bad Request',
      message: ['failed validation'],
      errors: ['PASSWORD_TOO_WEAK' as PasswordErrorCode]
    });
  });
});


describe('Pre-validate password hook test for /change-password', () => {

  it('Should fail in case newPassword is missing', async () => {
    const MockRequest = {
      body: {}
    };
    await validatePasswordHook(MockRequest as any, MockReply as any);
    expect(MockReply.status).toHaveBeenCalledWith(400);
    expect(MockReply.send).toHaveBeenCalledWith({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Password is required'
    });
  });


  it('Should validate a good newPassword and should not fail', async () => {
    const MockRequest = {
      body: {
        new_password: 'any'
      }
    };
    vi.spyOn(PasswordValidator, 'validatePassword').mockReturnValueOnce({
      valid: true,
      messages: [],
      errors: []
    });
    await validatePasswordHook(MockRequest as any, MockReply as any);
    expect(PasswordValidator.validatePassword).toHaveBeenCalledWith(
      'any',
      expect.any(Object)
    );
    
    expect(MockReply.status).not.toHaveBeenCalled();
    expect(MockReply.send).not.toHaveBeenCalled();
  });


  it('Should fail validation for a bad newPassword', async () => {
  
    vi.spyOn(PasswordValidator, 'validatePassword').mockReturnValueOnce({
      valid: false,
      messages: ['failed validation'],
      errors: ['PASSWORD_TOO_WEAK' as PasswordErrorCode]
    });
    const MockRequest = {
      body: {
        new_password: 'anything'
      }
    };
    await validatePasswordHook(MockRequest as any, MockReply as any);
    expect(PasswordValidator.validatePassword).toHaveBeenCalledWith(
      'anything',
      expect.any(Object)
    );
    expect(MockReply.status).toHaveBeenCalledWith(400);
    expect(MockReply.send).toHaveBeenCalledWith({
      statusCode: 400,
      error: 'Bad Request',
      message: ['failed validation'],
      errors: ['PASSWORD_TOO_WEAK' as PasswordErrorCode]
    });
  });

});