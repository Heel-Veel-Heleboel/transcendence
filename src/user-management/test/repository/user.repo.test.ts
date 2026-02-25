import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserRepository } from '../../src/repositories/user.js';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PrismaClient } from '../../generated/prisma/client.js';

const mockPrisma = {
  user: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
  }
} as unknown as PrismaClient;

const repo = new UserRepository(mockPrisma);

describe('UserRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should return user id on success', async () => {
      mockPrisma.user.create.mockResolvedValue({ id: 1, profile: {} });
      const result = await repo.create({ email: 'a@b.com', name: 'Amy' });
      expect(result).toEqual({ id: 1 });
    });

    it('should throw on unique email', async () => {
      mockPrisma.user.create.mockRejectedValue(
        new PrismaClientKnownRequestError('Unique error', { code: 'P2002', clientVersion: '1.0.0', meta: { target: ['email'] } })
      );
      await expect(repo.create({ email: 'a@b.com', name: 'Amy' }))
        .rejects.toThrow(/email/i);
    });

    it('should throw on unique name', async () => {
      mockPrisma.user.create.mockRejectedValue(
        new PrismaClientKnownRequestError('Unique error', { code: 'P2002', clientVersion: '1.0.0', meta: { target: ['name'] } })
      );
      await expect(repo.create({ email: 'a@b.com', name: 'Amy' }))
        .rejects.toThrow(/name/i);
    });
  });

  describe('delete', () => {
    it('should not throw on success', async () => {
      mockPrisma.user.delete.mockResolvedValue({});
      await expect(repo.delete({ id: 1 })).resolves.toBeUndefined();
    });

    it('should throw on not found', async () => {
      mockPrisma.user.delete.mockRejectedValue(
        new PrismaClientKnownRequestError('Not found', { code: 'P2025', clientVersion: '1.0.0' })
      );
      await expect(repo.delete({ id: 1 })).rejects.toThrow(/not found/i);
    });
  });

  describe('updateEmail', () => {
    it('should not throw on success', async () => {
      mockPrisma.user.update.mockResolvedValue({});
      await expect(repo.updateEmail({ id: 1, email: 'new@b.com' })).resolves.toBeUndefined();
    });

    it('should throw on unique email', async () => {
      mockPrisma.user.update.mockRejectedValue(
        new PrismaClientKnownRequestError('Unique error', { code: 'P2002', clientVersion: '1.0.0', meta: { target: ['email'] } })
      );
      await expect(repo.updateEmail({ id: 1, email: 'taken@b.com' })).rejects.toThrow(/email/i);
    });

    it('should throw on user not found', async () => {
      mockPrisma.user.update.mockRejectedValue(
        new PrismaClientKnownRequestError('Not found', { code: 'P2025', clientVersion: '1.0.0' })
      );
      await expect(repo.updateEmail({ id: 999, email: 'new@b.com' })).rejects.toThrow(/not found/i);
    });
  });

  describe('updateName', () => {
    it('should not throw on success', async () => {
      mockPrisma.user.update.mockResolvedValue({});
      await expect(repo.updateName({ id: 1, name: 'Amy' })).resolves.toBeUndefined();
    });

    it('should throw on unique name', async () => {
      mockPrisma.user.update.mockRejectedValue(
        new PrismaClientKnownRequestError('Unique error', { code: 'P2002', clientVersion: '1.0.0', meta: { target: ['name'] } })
      );
      await expect(repo.updateName({ id: 1, name: 'Amy' })).rejects.toThrow(/name/i);
    });

    it('should throw on user not found', async () => {
      mockPrisma.user.update.mockRejectedValue(
        new PrismaClientKnownRequestError('Not found', { code: 'P2025', clientVersion: '1.0.0' })
      );
      await expect(repo.updateName({ id: 999, name: 'Amy' })).rejects.toThrow(/not found/i);
    });
  });

  describe('updateStatus', () => {
    it('should not throw on success', async () => {
      mockPrisma.user.update.mockResolvedValue({});
      await expect(repo.updateStatus({ id: 1, activity_status: 'ONLINE' })).resolves.toBeUndefined();
    });

    it('should throw on user not found', async () => {
      mockPrisma.user.update.mockRejectedValue(
        new PrismaClientKnownRequestError('Not found', { code: 'P2025', clientVersion: '1.0.0' })
      );
      await expect(repo.updateStatus({ id: 999, activity_status: 'ONLINE' })).rejects.toThrow(/not found/i);
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: 'a@b.com', name: 'Amy' });
      const result = await repo.findById(1);
      expect(result).toEqual({ id: 1, email: 'a@b.com', name: 'Amy' });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await repo.findById(999);
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: 'test@example.com', name: 'Test' });
      const result = await repo.findByEmail('test@example.com');
      expect(result).toEqual({ id: 1, email: 'test@example.com', name: 'Test' });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await repo.findByEmail('notfound@example.com');
      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should return user by name', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: 'a@b.com', name: 'UniqueUser' });
      const result = await repo.findByName('UniqueUser');
      expect(result).toEqual({ id: 1, email: 'a@b.com', name: 'UniqueUser' });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { name: 'UniqueUser' } });
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await repo.findByName('NotFound');
      expect(result).toBeNull();
    });
  });

  describe('findByStatus', () => {
    it('should return users by status', async () => {
      mockPrisma.user.findMany.mockResolvedValue([{ id: 1, activity_status: 'ONLINE' }]);
      const result = await repo.findByStatus({ activity_status: 'ONLINE' });
      expect(result).toEqual([{ id: 1, activity_status: 'ONLINE' }]);
    });

    it('should return empty array when no users found', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      const result = await repo.findByStatus({ activity_status: 'AWAY' });
      expect(result).toEqual([]);
    });
  });
});