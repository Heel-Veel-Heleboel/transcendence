import { CredentialsDao } from '../../../src/auth/src/dao/credentials.dao.js';
import { CredentialsDaoShape } from '../../../src/auth/src/dao/credentials-contract.js';
import { describe, expect, it, vi, beforeEach } from 'vitest';


const mockPrismaClient = {
  userCredentials: {
    create: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn()
  }
};

describe('CredentialsDao', () => {
  let dao: CredentialsDaoShape;
  beforeEach(() => {
    vi.clearAllMocks();
    dao = new CredentialsDao(mockPrismaClient as any);
  });
  
  it('Should create a credential record ', async () => {
    await dao.create({ userId: 1, password: 'hashedPassword' });
    expect(mockPrismaClient.userCredentials.create).toBeCalled();
    expect(mockPrismaClient.userCredentials.create).toBeCalledWith({
      data: {
        userId: 1,
        hashedPassword: 'hashedPassword'
      }
    });
  });

  it('Should update a user password', async () => {
    await dao.updatePassword({ userId: 1, newPassword: 'newHashedPassword' });
    expect(mockPrismaClient.userCredentials.update).toBeCalled();
    expect(mockPrismaClient.userCredentials.update).toBeCalledWith({
      where: { userId: 1 },
      data: { hashedPassword: 'newHashedPassword' }
    });
  });

  it('Should find a credential by user id', async () => {
    mockPrismaClient.userCredentials.findUnique.mockResolvedValueOnce({ hashedPassword: 'hashedPassword' });
    const result = await dao.findByUserId({ userId: 1 });
    expect(mockPrismaClient.userCredentials.findUnique).toBeCalled();
    expect(mockPrismaClient.userCredentials.findUnique).toBeCalledWith({
      where: { userId: 1 }
    });
    expect(result).toBe('hashedPassword');
  });

  it('Should delete a credential by user id', async () => {
    await dao.deleteByUserId({ userId: 1 });
    expect(mockPrismaClient.userCredentials.delete).toBeCalled();
    expect(mockPrismaClient.userCredentials.delete).toBeCalledWith({
      where: { userId: 1 }
    });
  });

  it('Should return null if credential not found', async () => {
    mockPrismaClient.userCredentials.findUnique.mockResolvedValueOnce(null);
    const result = await dao.findByUserId({ userId: 2 });
    expect(mockPrismaClient.userCredentials.findUnique).toBeCalled();
    expect(mockPrismaClient.userCredentials.findUnique).toBeCalledWith({
      where: { userId: 2 }
    });
    expect(result).toBeNull();
  });

  it('Should handle delete for non-existing user gracefully', async () => {
    mockPrismaClient.userCredentials.delete.mockRejectedValueOnce(new Error('Record not found'));
    await expect(dao.deleteByUserId({ userId: 999 })).rejects.toThrow('Record not found');
    expect(mockPrismaClient.userCredentials.delete).toBeCalled();
    expect(mockPrismaClient.userCredentials.delete).toBeCalledWith({
      where: { userId: 999 }
    });
  });

  it('Should handle errors gracefully', async () => {
    mockPrismaClient.userCredentials.create.mockRejectedValueOnce(new Error('DB Error'));
    await expect(dao.create({ userId: 1, password: 'hashedPassword' })).rejects.toThrow('DB Error');
  }); 

});
