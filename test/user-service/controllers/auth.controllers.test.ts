import { describe, it, beforeEach, expect, vi, Mock } from 'vitest';
import { registerUserController } from '../../../src/user-service/src/controllers/auth.controller.js';
import { createUser } from '../../../src/user-service/src/services/auth.service.js';
import { validatePassword } from '../../../src/user-service/src/utils/password-validator.js';
import { DuplicateEntryError, DatabaseError } from '../../../src/user-service/src/error/prisma-error.js';

// Mock the dependencies
vi.mock('../../../src/user-service/src/services/auth.service.js');
vi.mock('../../../src/user-service/src/utils/password-validator.js');

describe('Auth Controller - registerUserController', () => {
  let mockRequest: any;
  let mockReply: any;
  let mockCreateUser: Mock;
  let mockValidatePassword: Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCreateUser = createUser as Mock;
    mockValidatePassword = validatePassword as Mock;

    // Mock Fastify request
    mockRequest = {
      body: {},
      server: {
        prisma: {}
      },
      log: {
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn()
      }
    };

    // Mock Fastify reply
    mockReply = {
      status: vi.fn().mockReturnThis(),
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis()
    };
  });




  describe('Successful registration', () => {
    it('should register a user successfully and return 201', async () => {
      const userData = {
        email: 'test@gmail.com',
        username: 'testuser',
        password: 'Password@123'
      };

      mockRequest.body = userData;

      mockValidatePassword.mockReturnValue({
        valid: true,
        errors: []
      });

      const mockSafeUser = {
        id: 1,
        email: userData.email,
        username: userData.username,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockCreateUser.mockResolvedValue(mockSafeUser);

      await registerUserController(mockRequest, mockReply);

      expect(mockValidatePassword).toHaveBeenCalledWith(userData.password);
      expect(mockCreateUser).toHaveBeenCalledWith(
        mockRequest.server.prisma,
        userData
      );
      expect(mockReply.code).toHaveBeenCalledWith(201);
      expect(mockReply.send).toHaveBeenCalledWith({
        message: 'User registered successfully.',
        user: mockSafeUser
      });
    });
  });




  describe('Validation errors', () => {
    it('should return 400 if email is missing', async () => {
      mockRequest.body = {
        username: 'testuser',
        password: 'Password@123'
      };

      await registerUserController(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Email is required.'
      });
      expect(mockValidatePassword).not.toHaveBeenCalled();
      expect(mockCreateUser).not.toHaveBeenCalled();
    });




    it('should return 400 if username is missing', async () => {
      mockRequest.body = {
        email: 'test@gmail.com',
        password: 'Password@123'
      };

      await registerUserController(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Username is required.'
      });
      expect(mockValidatePassword).not.toHaveBeenCalled();
      expect(mockCreateUser).not.toHaveBeenCalled();
    });




    it('should return 400 if password is missing', async () => {
      mockRequest.body = {
        email: 'test@gmail.com',
        username: 'testuser'
      };

      await registerUserController(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Password is required.'
      });
      expect(mockValidatePassword).not.toHaveBeenCalled();
      expect(mockCreateUser).not.toHaveBeenCalled();
    });
  });




  describe('Password validation failure', () => {
    it('should return 400 if password validation fails', async () => {
      mockRequest.body = {
        email: 'test@gmail.com',
        username: 'testuser',
        password: 'weak'
      };

      const validationErrors = [
        'Password must be at least 8 characters',
        'Password must contain an uppercase letter'
      ];

      mockValidatePassword.mockReturnValue({
        valid: false,
        errors: validationErrors
      });

      await registerUserController(mockRequest, mockReply);

      expect(mockValidatePassword).toHaveBeenCalledWith('weak');
      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Password does not meet the policy requirements.',
        details: validationErrors
      });
      expect(mockCreateUser).not.toHaveBeenCalled();
    });
  });




  describe('Duplicate entry errors', () => {
    it('should return 409 when email already exists', async () => {
      mockRequest.body = {
        email: 'test@gmail.com',
        username: 'testuser',
        password: 'Password@123'
      };

      mockValidatePassword.mockReturnValue({
        valid: true,
        errors: []
      });

      const duplicateError = new DuplicateEntryError('email');
      mockCreateUser.mockRejectedValue(duplicateError);

      await registerUserController(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(409);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'email already exists.',
        field: 'email'
      });
    });
  });




  describe('Database errors', () => {
    it('should return 500 when DatabaseError occurs', async () => {
      mockRequest.body = {
        email: 'test@gmail.com',
        username: 'testuser',
        password: 'Password@123'
      };

      mockValidatePassword.mockReturnValue({
        valid: true,
        errors: []
      });

      const dbError = new DatabaseError('Connection timeout');
      mockCreateUser.mockRejectedValue(dbError);

      await registerUserController(mockRequest, mockReply);

      expect(mockRequest.log.error).toHaveBeenCalled();
      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Failed to create user. Please try again later.'
      });
    });
  });




  describe('Unexpected errors', () => {
    it('should return 500 for unexpected errors', async () => {
      mockRequest.body = {
        email: 'test@gmail.com',
        username: 'testuser',
        password: 'Password@123'
      };

      mockValidatePassword.mockReturnValue({
        valid: true,
        errors: []
      });

      const unexpectedError = new Error('Unexpected');
      mockCreateUser.mockRejectedValue(unexpectedError);

      await registerUserController(mockRequest, mockReply);

      expect(mockRequest.log.error).toHaveBeenCalled();
      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'An unexpected error occurred.'
      });
    });
  });
});