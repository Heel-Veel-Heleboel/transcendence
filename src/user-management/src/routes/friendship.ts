import { FastifyInstance } from 'fastify';
import { FriendshipController } from '../controllers/friendship.js';
import {
  CreateFriendshipSchema,
  DeleteFriendshipSchema,
  UpdateFriendshipStatusSchema,
  GetFriendshipSchema,
  FindAllForUserSchema,
  IsBlockedSchema,
  FindAllByStatusForUserSchema,
  FriendshipSchema
} from '../schemas/friendship.js';

export async function friendshipRoutes(
  fastify: FastifyInstance,
  options: { friendController: FriendshipController }
) {
  const { friendController } = options;

  fastify.post('/create', {
    schema: { body: CreateFriendshipSchema },
    handler: friendController.createFriendship.bind(friendController)
  });

  fastify.delete('/delete', {
    schema: { body: DeleteFriendshipSchema },
    handler: friendController.deleteFriendship.bind(friendController)
  });

  fastify.patch('/update-status', {
    schema: { body: UpdateFriendshipStatusSchema },
    handler: friendController.updateFriendshipStatus.bind(friendController)
  });

  fastify.get('/find-by-id/:id', {
    schema: { params: GetFriendshipSchema },
    handler: friendController.getFriendship.bind(friendController)
  });

  fastify.get('/between/:userId1/:userId2', {
    schema: { params: FriendshipSchema },
    handler: friendController.getFriendshipBetween.bind(friendController)
  });

  fastify.get('/find-all-for-user/:userId', {
    schema: { params: FindAllForUserSchema },
    handler: friendController.findAllForUser.bind(friendController)
  });

  fastify.get('/find-all-by-status-for-user/:userId/:status', {
    schema: { params: FindAllByStatusForUserSchema },
    handler: friendController.findAllByStatusForUser.bind(friendController)
  });

  fastify.get('/is-blocked/:userId1/:userId2', {
    schema: { params: IsBlockedSchema },
    handler: friendController.isBlocked.bind(friendController)
  });
}

