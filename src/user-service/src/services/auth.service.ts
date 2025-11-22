import type { SafeUser, CreateUserData, AuthResponse, LoginUserData } from '../types/user.js';
import { hashPassword, comparePassword } from '../utils/password-utils.js';
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



export async function loginUser(prisma: PrismaClient, data: LoginUserData): Promise<AuthResponse> {
  try {

    const user = await prisma.user.findUnique({
      where : {
        email: data.email
      }
    });
    if(!user) {
      throw new Error('Invalid credentials!');
    }

    const isValidPassword = await comparePassword(data.password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials!');
    }

    const { password: _password, ...safeUser }  = user;
    return ({ token: 'token', user: safeUser, expiresIn: '5d' });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new DatabaseError(error.message);
    }
    throw new DatabaseError('Login failed.');
  }
}