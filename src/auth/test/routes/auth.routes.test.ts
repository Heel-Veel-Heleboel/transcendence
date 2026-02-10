import { expect, it, describe, vi } from 'vitest';
import { authRoutes } from '../../src/routes/auth.js';

import * as SchemaTypes from '../../src/schemas/auth.js';
import { validatePasswordHook } from '../../src/middleware/validate-password-hook.js';


describe('Auth routes', () => {
  
  it('Should register all routes', async () =>{
    const MockFastify = {
      post: vi.fn()
    };
  
    const MockControllers = {
      register: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
      changePassword: vi.fn()
    };
    await authRoutes(MockFastify as any, { authController: MockControllers as any });

    expect(MockFastify.post).toBeCalledTimes(5);
    expect(MockFastify.post).toHaveBeenCalledWith('/register', expect.objectContaining({
      schema: SchemaTypes.RegistrationSchema,
      preValidation: validatePasswordHook,
      handler: expect.any(Function)
    }));
    expect(MockFastify.post).toHaveBeenCalledWith('/change-password', expect.objectContaining({
      schema: SchemaTypes.ChangePasswordSchema,
      preValidation: validatePasswordHook,
      handler: expect.any(Function)
    }));
    expect(MockFastify.post).toHaveBeenCalledWith('/login', expect.objectContaining({
      schema: SchemaTypes.LoginSchema,
      handler: expect.any(Function)
    }));
    expect(MockFastify.post).toHaveBeenCalledWith('/logout', expect.objectContaining({
      schema: SchemaTypes.LogoutSchema,
      handler: expect.any(Function)
    }));
    expect(MockFastify.post).toHaveBeenCalledWith('/refresh', expect.objectContaining({
      schema: SchemaTypes.RefreshSchema,
      handler: expect.any(Function)
    }));

    expect(MockControllers.register).not.toBeCalled();
    expect(MockControllers.login).not.toBeCalled();
    expect(MockControllers.logout).not.toBeCalled();
    expect(MockControllers.refresh).not.toBeCalled();
    expect(MockControllers.changePassword).not.toBeCalled();
  });
});