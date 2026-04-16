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
  FriendshipSchema,
  BlockUserSchema
} from '../schemas/friendship.js';
import { Type } from '@fastify/type-provider-typebox';

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

  fastify.post('/cancel', {
    schema: {
      body: Type.Object({
        friendship_id: Type.Number(),
        requester_id: Type.Number()
      })
    },
    handler: friendController.cancelFriendshipRequest.bind(friendController)
  });

  fastify.patch('/update-status', {
    schema: { body: UpdateFriendshipStatusSchema },
    handler: friendController.updateFriendshipStatus.bind(friendController)
  });

  fastify.post('/block', {
    schema: { body: BlockUserSchema },
    handler: friendController.blockUser.bind(friendController)
  });

  fastify.post('/unblock', {
    schema: { body: BlockUserSchema },
    handler: friendController.unblockUser.bind(friendController)
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

  fastify.get('/is-blocked-by/:blocker_id/:target_id', {
    schema: { params: IsBlockedSchema },
    handler: friendController.isBlockedBy.bind(friendController)
  });
}
