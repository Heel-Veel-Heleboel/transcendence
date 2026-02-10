import { AuthService } from '../../src/services/auth.js';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockUserService = {
  createUser: vi.fn(),
  deleteUser: vi.fn()
};

const mockCredentialsDao = {
  create: vi.fn()
};

describe('AuthService - register', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService(
      mockUserService as any,
      mockCredentialsDao as any,
      {} as any 
    );
  });

  it('Should register a new user successfully', async () => {
    mockUserService.createUser.mockResolvedValueOnce(1);
    mockCredentialsDao.create.mockResolvedValueOnce(undefined);

    const result = await authService.register( { user_name: 'testuser', email: 'testuser@example.com', password: 'password123' } );
    expect(mockUserService.createUser).toBeCalledWith('testuser@example.com', 'testuser');
    expect(mockCredentialsDao.create).toBeCalled();
    expect(result).toEqual({ id: 1, name: 'testuser', email: 'testuser@example.com' });
  });

  it('Should handle user creation failure', async () => {
    mockUserService.createUser.mockRejectedValueOnce(new Error('User creation failed'));
    
    await expect(authService.register( { user_name: 'testuser', email: 'testuser@example.com', password: 'password123' } )).rejects.toThrow('User creation failed');
    expect(mockUserService.createUser).toBeCalledWith('testuser@example.com', 'testuser');
    expect(mockCredentialsDao.create).not.toBeCalled();
  });

  it('Should rollback user creation on credential failure', async () => {
    mockUserService.createUser.mockResolvedValueOnce(1);
    mockCredentialsDao.create.mockRejectedValueOnce(new Error('Credential creation failed'));

    await expect(authService.register( { user_name: 'testuser', email: 'testuser@example.com', password: 'password123' } )).rejects.toThrow('Credential creation failed');
    expect(mockUserService.createUser).toBeCalledWith('testuser@example.com', 'testuser');
    expect(mockCredentialsDao.create).toBeCalled();
    expect(mockUserService.deleteUser).toBeCalledWith(1);
  });

  it('Should handle delete failure during rollback gracefully', async () => {
    mockUserService.createUser.mockResolvedValueOnce(1);
    mockCredentialsDao.create.mockRejectedValueOnce(new Error('Credential creation failed'));
    mockUserService.deleteUser.mockRejectedValueOnce(new Error('Delete user failed'));

    await expect(authService.register( { user_name: 'testuser', email: 'testuser@example.com', password: 'password123' } )).rejects.toThrow('Credential creation failed');
    expect(mockUserService.createUser).toBeCalledWith('testuser@example.com', 'testuser');
    expect(mockCredentialsDao.create).toBeCalled();
    expect(mockUserService.deleteUser).toBeCalledWith(1);
  });
});