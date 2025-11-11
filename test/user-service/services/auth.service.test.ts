import { describe, it, beforeEach, afterEach, expect } from 'vitest';

import { createUser } from '../../../src/user-service/src/services/auth.service.js';
import { PrismaClient } from '@prisma/client';

describe('Auth Service', () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = new PrismaClient();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('should create a new user and return a safe user object', async () => {
    const userData = {
      email: ' amysiv9@gmail.com',
      username: 'testuser',
      password: 'password123'
    };

    const safeUser = await createUser(prisma, userData);

    expect(safeUser).toHaveProperty('id');
    expect(safeUser).toHaveProperty('email', userData.email);
    expect(safeUser).toHaveProperty('username', userData.username);
    expect(safeUser).not.toHaveProperty('password');


    // Clean up - delete the created user
    await prisma.user.delete({ where: { id: safeUser.id } });
  });
});