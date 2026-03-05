//services
import { UserService } from '../services/user.js';
import { ProfileService } from '../services/profile.js';
//controllers
import { UserController } from '../controllers/user.js';
import { ProfileController } from '../controllers/profile.js';
//repositories
import { UserRepository } from '../repositories/user.js';
import { ProfileRepository } from '../repositories/profile.js';
//prisma
import { getPrismaClient } from '../db/prisma-client.js';

//auth client
import { AuthClient } from '../client/auth.js';

import { env } from './env.js';

export function composeDependencies() {
  const prisma = getPrismaClient();

  const authClient = new AuthClient(env.AUTH_SERVICE_URL, 1000);

  const userRepository = new UserRepository(prisma);
  const profRepository = new ProfileRepository(prisma);

  const userService = new UserService(userRepository, authClient);
  const profService = new ProfileService(profRepository);

  const userController = new UserController(userService);
  const profController = new ProfileController(profService);

  return {
    userController,
    profController
  };
  
}
