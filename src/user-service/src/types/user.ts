import { User } from '@prisma/client';

export type SafeUser = Omit<User, 'password'>;

export type CreateUserData = Pick<User, 'email' | 'username' | 'password'>;