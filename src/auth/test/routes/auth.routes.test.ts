import { expect, it, describe, vi } from 'vitest';
import { authRoutes } from '../../src/routes/auth.js';

import * as SchemaTypes from '../../src/schemas/auth.js';
import { validatePasswordHook } from '../../src/middleware/validate-password-hook.js';


describe('Auth routes', () => {
  
  it('Should register all routes', async () =>{
    const MockFastify = {
      post: vi.fn(),
      put: vi.fn(),
      get: vi.fn(),
      delete: vi.fn()
    };
  
    const MockControllers = {
      register: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
      changePassword: vi.fn(),
      deleteAuthDataForUser: vi.fn()
    };
    await authRoutes(MockFastify as any, { authController: MockControllers as any });

    expect(MockFastify.post).toBeCalledTimes(4);
    expect(MockFastify.put).toBeCalledTimes(1);
    expect(MockFastify.delete).toBeCalledTimes(1);
    expect(MockFastify.get).toBeCalledTimes(0);
    expect(MockFastify.post).toHaveBeenCalledWith('/register', expect.objectContaining({
      schema: SchemaTypes.RegistrationSchema,
      preValidation: validatePasswordHook,
      handler: expect.any(Function)
    }));
    expect(MockFastify.put).toHaveBeenCalledWith('/change-password', expect.objectContaining({
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

    expect(MockFastify.delete).toHaveBeenCalledWith('/delete-auth-data', expect.objectContaining({
      schema: SchemaTypes.DeleteAuthDataSchema,
      handler: expect.any(Function)
    }));

    expect(MockControllers.register).not.toBeCalled();
    expect(MockControllers.login).not.toBeCalled();
    expect(MockControllers.logout).not.toBeCalled();
    expect(MockControllers.refresh).not.toBeCalled();
    expect(MockControllers.changePassword).not.toBeCalled();
    expect(MockControllers.deleteAuthDataForUser).not.toBeCalled();
  });
});