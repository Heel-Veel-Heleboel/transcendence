import { UserService } from '../services/user.js';
import { UserController } from '../controllers/user.js';
import { UserRepository } from '../repositories/user.js';
import { getPrismaClient } from '../db/prisma-client.js';
import { AuthClient } from '../client/auth.js';
import { env } from '../config/env.js';

export function getUserController() {
  const prisma = getPrismaClient();
  const authClient = new AuthClient(env.AUTH_SERVICE_URL, 1000);
  const userRepository = new UserRepository(prisma);
  const userService = new UserService(userRepository, authClient);
  return new UserController(userService);
}
