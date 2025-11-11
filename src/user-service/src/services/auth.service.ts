import type { SafeUser, CreateUserData } from '../types/user.js';
import { hashPassword } from '../utils/hash.js';
import { PrismaClient } from '@prisma/client';


export async function createUser(prisma: PrismaClient, data: CreateUserData) : Promise<SafeUser> {

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
}

