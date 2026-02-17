import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from '../../src/services/user.js';
import { UserRepository } from '../../src/repositories/user.js';
import * as SchemaTypes from '../../src/schemas/user.services.js';

describe('UserService', () => {
  let service: UserService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      create: vi.fn(),
      update: vi.fn(),
      updateStatus: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findByName: vi.fn(),
      findByStatus: vi.fn(),
      delete: vi.fn()
    };
    service = new UserService(mockRepo);
  });

  describe('createUser', () => {
    it('should create user and return id', async () => {
      const input: SchemaTypes.CreateUserSchemaType = {
        user_email: 'test@example.com',
        user_name: 'testuser'
      };

      mockRepo.create.mockResolvedValue({ id: 1 });

      const result = await service.createUser(input);

      expect(result).toEqual({ id: 1 });
      expect(mockRepo.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'testuser'
      });
    });
    
  });

  describe('updateUser', () => {
    it('should update user with provided fields', async () => {
      const input: SchemaTypes.UpdateUserSchemaType = {
        user_id: 1,
        user_email: 'new@example.com',
        user_name: 'newname'
      };

      await service.updateUser(input);

      expect(mockRepo.update).toHaveBeenCalledWith({
        id: 1,
        email: 'new@example.com',
        name: 'newname'
      });
    });

    it('should throw if no fields provided', async () => {
      const input: SchemaTypes.UpdateUserSchemaType = {
        user_id: 1
      };

      await expect(service.updateUser(input)).rejects.toThrow(
        'At least one field (email or name) must be provided for update.'
      );
    });
  });

  describe('updateStatus', () => {
    it('should update user activity status', async () => {
      const input: SchemaTypes.UpdateUserStatusSchemaType = {
        user_id: 1,
        activity_status: 'ONLINE'
      };

      await service.updateStatus(input);

      expect(mockRepo.updateStatus).toHaveBeenCalledWith({
        id: 1,
        activity_status: 'ONLINE'
      });
    });
  });

  describe('findUserById', () => {
    it('should find user by id', async () => {
      const mockUser = { id: 1, email: 'test@test.com', name: 'test' };
      mockRepo.findById.mockResolvedValue(mockUser);

      const input: SchemaTypes.FindUserByIdSchemaType = { user_id: 1 };
      const result = await service.findUserById(input);

      expect(result).toEqual(mockUser);
      expect(mockRepo.findById).toHaveBeenCalledWith(1);
    });
  });

  describe('findUserByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = { id: 1, email: 'test@test.com', name: 'test' };
      mockRepo.findByEmail.mockResolvedValue(mockUser);

      const input: SchemaTypes.FindUserByEmailSchemaType = { user_email: 'test@test.com' };
      const result = await service.findUserByEmail(input);

      expect(result).toEqual(mockUser);
      expect(mockRepo.findByEmail).toHaveBeenCalledWith('test@test.com');
    });
  });

  describe('deleteUser', () => {
    it('should delete user by id', async () => {
      const input: SchemaTypes.FindUserByIdSchemaType = { user_id: 1 };
      
      await service.deleteUser(input);

      expect(mockRepo.delete).toHaveBeenCalledWith({ id: 1 });
    });
  });
});