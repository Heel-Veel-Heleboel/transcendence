import { CredentialsDao } from '../../../src/auth/src/dao/credentials.dao.js';
import { ICredentialsDao } from '../../../src/auth/src/types/daos/credentials.js';
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
  let dao: ICredentialsDao;
  beforeEach(() => {
    vi.clearAllMocks();
    dao = new CredentialsDao(mockPrismaClient as any);
  });
  
  it('Should create a credential record ', async () => {
    await dao.create({ user_id: 1, password: 'hashed_password' });
    expect(mockPrismaClient.userCredentials.create).toBeCalled();
    expect(mockPrismaClient.userCredentials.create).toBeCalledWith({
      data: {
        user_id: 1,
        hashed_password: 'hashed_password'
      }
    });
  });

  it('Should update a user password', async () => {
    await dao.updatePassword({ user_id: 1, new_password: 'new_hashed_password' });
    expect(mockPrismaClient.userCredentials.update).toBeCalled();
    expect(mockPrismaClient.userCredentials.update).toBeCalledWith({
      where: { user_id: 1 },
      data: { hashed_password: 'new_hashed_password' }
    });
  });

  it('Should find a credential by user id', async () => {
    mockPrismaClient.userCredentials.findUnique.mockResolvedValueOnce({ user_id: 1, hashed_password: 'hashed_password' });
    const result = await dao.findByUserId({ user_id: 1 });
    expect(mockPrismaClient.userCredentials.findUnique).toBeCalled();
    expect(mockPrismaClient.userCredentials.findUnique).toBeCalledWith({
      where: { user_id: 1 }
    });
    expect(result).toEqual({ user_id: 1, hashed_password: 'hashed_password' });
  });

  it('Should delete a credential by user id', async () => {
    await dao.deleteByUserId({ user_id: 1 });
    expect(mockPrismaClient.userCredentials.delete).toBeCalled();
    expect(mockPrismaClient.userCredentials.delete).toBeCalledWith({
      where: { user_id: 1 }
    });
  });

  it('Should return null if credential not found', async () => {
    mockPrismaClient.userCredentials.findUnique.mockResolvedValueOnce(null);
    const result = await dao.findByUserId({ user_id: 2 });
    expect(mockPrismaClient.userCredentials.findUnique).toBeCalled();
    expect(mockPrismaClient.userCredentials.findUnique).toBeCalledWith({
      where: { user_id: 2 }
    });
    expect(result).toBeNull();
  });

  it('Should handle delete for non-existing user gracefully', async () => {
    mockPrismaClient.userCredentials.delete.mockRejectedValueOnce(new Error('Record not found'));
    await expect(dao.deleteByUserId({ user_id: 999 })).rejects.toThrow('Record not found');
    expect(mockPrismaClient.userCredentials.delete).toBeCalled();
    expect(mockPrismaClient.userCredentials.delete).toBeCalledWith({
      where: { user_id: 999 }
    });
  });

  it('Should handle errors gracefully', async () => {
    mockPrismaClient.userCredentials.create.mockRejectedValueOnce(new Error('DB Error'));
    await expect(dao.create({ user_id: 1, password: 'hashed_password' })).rejects.toThrow('DB Error');
  }); 

});
