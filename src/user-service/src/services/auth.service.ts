import type { SafeUser, CreateUserData } from '../types/user.js';
import { hashPassword } from '../utils/password-utils.js';
import { PrismaClient } from '@prisma/client';
import { DatabaseError, DuplicateEntryError, isPrismaKnownError } from '../error/prisma-error.js';



export async function createUser(prisma: PrismaClient, data: CreateUserData) : Promise<SafeUser> {
  try {

    const hashedPassword = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword
      }
    });
    const  { password: _password, ...safeUser } = user;
    return safeUser;

  } catch (error: unknown) {

    if (isPrismaKnownError(error)) {
      if (error.code === 'P2002') {
        const targets = error.meta?.target as string[] | undefined;
        const field = targets?.[0] || 'field';
        throw new DuplicateEntryError(field);
      }
      throw new DatabaseError(error.message || 'Database operation failed');
    }
    throw new DatabaseError(error instanceof Error ? error.message : 'Unknown database error');

  }
}