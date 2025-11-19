import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { createUser } from '../../../src/user-service/src/services/auth.service.js';
import { hashPassword } from '../../../src/user-service/src/utils/password-utils.js';
import { DuplicateEntryError, DatabaseError } from '../../../src/user-service/src/error/prisma-error.js';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library.js';

// Mock the hash utility
vi.mock('../../../src/user-service/src/utils/password-utils.js');

describe('Auth Service - createUser', () => {
  let mockPrisma: any;
  let mockHashPassword: Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    mockHashPassword = hashPassword as Mock;

    mockPrisma = {
      user: {
        create: vi.fn()
      }
    };
  });




  describe('Successful user creation', () => {

    it('should create a new user and return a safe user object without password', async () => {
      const userData = {
        email: 'test@test.com',
        username: 'testuser',
        password: 'Password@123'
      };

      const hashedPassword = 'hashed_Password@123';
      mockHashPassword.mockResolvedValue(hashedPassword);

      const createdUser = {
        id: 1,
        email: userData.email,
        username: userData.username,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.user.create.mockResolvedValue(createdUser);

      const result = await createUser(mockPrisma, userData);

      expect(mockHashPassword).toHaveBeenCalledWith(userData.password);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: userData.email,
          username: userData.username,
          password: hashedPassword
        }
      });

      expect(result).toEqual({
        id: 1,
        email: userData.email,
        username: userData.username,
        createdAt: createdUser.createdAt,
        updatedAt: createdUser.updatedAt
      });

      expect(result).not.toHaveProperty('password');
    });




    it('should hash the password before storing', async () => {
      const userData = {
        email: 'test@test.com',
        username: 'testuser',
        password: 'PlainPassword@123'
      };

      mockHashPassword.mockResolvedValue('hashed_PlainPassword@123');
      mockPrisma.user.create.mockResolvedValue({
        id: 1,
        ...userData,
        password: 'hashed_PlainPassword@123',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await createUser(mockPrisma, userData);

      expect(mockHashPassword).toHaveBeenCalledWith('PlainPassword@123');
    });
  });




  describe('Duplicate entry errors', () => {

    it('should throw DuplicateEntryError when email already exists', async () => {
      const userData = {
        email: 'duplicate@test.com',
        username: 'testuser',
        password: 'Password@123'
      };

      mockHashPassword.mockResolvedValue('hashed_password');

      // Create proper PrismaClientKnownRequestError instance
      const prismaError = new PrismaClientKnownRequestError('Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['email'] }
        }
      );
      
      mockPrisma.user.create.mockRejectedValue(prismaError);
      
      try {
        await createUser(mockPrisma, userData);
        expect.fail('Should have thrown DuplicateEntryError');
      } catch (error) {

        expect(error).toBeInstanceOf(DuplicateEntryError);
        expect((error as DuplicateEntryError).message).toBe('email already exists.');
        expect((error as DuplicateEntryError).field).toBe('email');
      }
    });




    it('should throw DuplicateEntryError when username already exists', async () => {
      const userData = {
        email: 'test@test.com',
        username: 'duplicateuser',
        password: 'Password@123'
      };

      mockHashPassword.mockResolvedValue('hashed_password');

      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['username'] }
        }
      );

      mockPrisma.user.create.mockRejectedValue(prismaError);

      try {
        await createUser(mockPrisma, userData);
        expect.fail('Should have thrown DuplicateEntryError');
      } catch (error) {
        expect(error).toBeInstanceOf(DuplicateEntryError);
        expect((error as DuplicateEntryError).message).toBe('username already exists.');
        expect((error as DuplicateEntryError).field).toBe('username');
      }
    });




    it('should handle P2002 error without meta.target gracefully', async () => {
      const userData = {
        email: 'test@test.com',
        username: 'testuser',
        password: 'Password@123'
      };

      mockHashPassword.mockResolvedValue('hashed_password');

      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: {}
        }
      );

      mockPrisma.user.create.mockRejectedValue(prismaError);

      try {
        await createUser(mockPrisma, userData);
        expect.fail('Should have thrown DuplicateEntryError');
      } catch (error) {
        expect(error).toBeInstanceOf(DuplicateEntryError);
        expect((error as DuplicateEntryError).message).toBe('field already exists.');
        expect((error as DuplicateEntryError).field).toBe('field');
      }
    });
  });




  describe('Database errors', () => {

    it('should throw DatabaseError for other Prisma errors', async () => {
      const userData = {
        email: 'test@test.com',
        username: 'testuser',
        password: 'Password@123'
      };

      mockHashPassword.mockResolvedValue('hashed_password');

      const prismaError = new PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          code: 'P2003',
          clientVersion: '5.0.0',
          meta: {}
        }
      );

      mockPrisma.user.create.mockRejectedValue(prismaError);

      try {
        await createUser(mockPrisma, userData);
        expect.fail('Should have thrown DatabaseError');
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseError);
      }
    });




    it('should throw DatabaseError for unknown errors', async () => {
      const userData = {
        email: 'test@test.com',
        username: 'testuser',
        password: 'Password@123'
      };

      mockHashPassword.mockResolvedValue('hashed_password');

      const unknownError = new Error('Something went wrong');
      mockPrisma.user.create.mockRejectedValue(unknownError);

      try {
        await createUser(mockPrisma, userData);
        expect.fail('Should have thrown DatabaseError');
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseError);
        expect((error as DatabaseError).message).toBe('Something went wrong');
      }
    });
  });
});