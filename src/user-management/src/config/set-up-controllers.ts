//services
import { UserService } from '../services/user.js';
import { ProfileService } from '../services/profile.js';
import { FriendshipService } from '../services/friendship.js';

//controllers
import { UserController } from '../controllers/user.js';
import { ProfileController } from '../controllers/profile.js';
import { FriendshipController } from '../controllers/friendship.js';

//repositories
import { UserRepository } from '../repositories/user.js';
import { ProfileRepository } from '../repositories/profile.js';
import { FriendshipRepository } from '../repositories/friendship.js';

//dependencies
import { getPrismaClient } from '../db/prisma-client.js';
import { ApiGatewayClient } from '../client/api-gateway.js';

//auth client
import { AuthClient } from '../client/auth.js';

import { env } from './env.js';

export function composeDependencies() {
  const prisma = getPrismaClient();

  const authClient = new AuthClient(env.AUTH_SERVICE_URL, 1000);
  const apiGatewayClient = new ApiGatewayClient(env.API_GATEWAY_URL, 1000);
  const userRepository = new UserRepository(prisma);
  const profRepository = new ProfileRepository(prisma);
  const friendRepository = new FriendshipRepository(prisma);

  const userService = new UserService(userRepository, authClient);
  const profService = new ProfileService(profRepository);
  const friendService = new FriendshipService(friendRepository, apiGatewayClient);

  const userController = new UserController(userService);
  const profController = new ProfileController(profService);
  const friendController = new FriendshipController(friendService);

  return {
    userController,
    profController,
    friendController
  };
}

