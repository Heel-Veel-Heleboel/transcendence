import { UserService } from '../services/user.js';
import { UserController } from '../controllers/user.js';
import { UserRepository } from '../repositories/user.js';
import { prisma } from '../db/prisma-client.js';

export function getUserController() {
  const userRepository = new UserRepository(prisma);
  const userService = new UserService(userRepository);
  return new UserController(userService);
}
