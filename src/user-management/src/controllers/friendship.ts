import { FriendshipService } from '../services/friendship.js';
import { FastifyRequest , FastifyReply } from 'fastify';
import { FriendshipStatus } from '../../generated/prisma/client.js';
import * as Error from '../error/user-management.js';

export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) {}

  async createFriendship(req: FastifyRequest<{ Body: { requester_id: number; addressee_id: number } }>, res: FastifyReply): Promise<void> {
    const { requester_id, addressee_id } = req.body;
    req.log.info(`Friendship request from user ${requester_id} to user ${addressee_id}`);
    try {
      await this.friendshipService.createFriendship({ requester_id, addressee_id });
    } catch (e) {
      if (e instanceof Error.BlockedByUserError) {
        res.status(403).send({ message: 'You have been blocked by this user' });
        return;
      }
      throw e;
    }
    res.status(201).send({ message: 'Friendship request sent' });
  }



  async deleteFriendship(req: FastifyRequest<{ Body: { id: number } }>, res: FastifyReply): Promise<void> {
    const { id } = req.body;
    req.log.info(`Deleting friendship with id ${id}`);
    await this.friendshipService.deleteFriendship({ id });
    res.status(200).send({ message: 'Friendship deleted' });
  }



  async cancelFriendshipRequest(req: FastifyRequest<{ Body: { friendship_id: number; requester_id: number } }>, res: FastifyReply): Promise<void> {
    const { friendship_id, requester_id } = req.body;
    req.log.info(`User ${requester_id} cancelling friendship request ${friendship_id}`);
    try {
      await this.friendshipService.cancelFriendshipRequest({ friendship_id, requester_id });
    } catch (e) {
      if (e instanceof Error.FriendshipNotFoundError) {
        res.status(404).send({ message: 'Friendship request not found' });
        return;
      }
      if (e instanceof Error.NotAuthorizedError) {
        res.status(403).send({ message: 'Not authorized to cancel this request' });
        return;
      }
      throw e;
    }
    res.status(200).send({ message: 'Friendship request cancelled' });
  }



  async updateFriendshipStatus(req: FastifyRequest<{ Body: { id: number; status: FriendshipStatus; addressee_id?: number } }>, res: FastifyReply): Promise<void> {
    const { id, status, addressee_id } = req.body;
    req.log.info(`Updating friendship ${id} to status ${status}`);
    try {
      const updatedFriendship = await this.friendshipService.updateFriendshipStatus({ id, status, addressee_id });
      res.status(200).send(updatedFriendship);
    } catch (e) {
      if (e instanceof Error.NotAuthorizedError) {
        res.status(403).send({ message: 'Only the addressee can accept or reject a request' });
        return;
      }
      if (e instanceof Error.FriendshipNotFoundError) {
        res.status(404).send({ message: 'Friendship not found' });
        return;
      }
      throw e;
    }
  }



  async getFriendship(req: FastifyRequest<{ Params: { id: number } }>, res: FastifyReply): Promise<void> {
    const { id } = req.params;
    const friendship = await this.friendshipService.getFriendship({ id });
    if (!friendship) {
      res.status(404).send({ message: 'Friendship not found' });
      return;
    }
    res.status(200).send(friendship);
  }

  async getFriendshipBetween(req: FastifyRequest<{ Params: { userId1: number; userId2: number } }>, res: FastifyReply): Promise<void> {
    const { userId1, userId2 } = req.params;
    const friendship = await this.friendshipService.getFriendshipBetween({ userId1, userId2 });
    if (!friendship) {
      res.status(404).send({ message: 'Friendship not found' });
      return;
    }
    res.status(200).send(friendship);
  }



  async findAllForUser(req: FastifyRequest<{ Params: { userId: number } }>, res: FastifyReply): Promise<void> {
    const { userId } = req.params;
    const friendships = await this.friendshipService.getUserFriendships({ userId });
    res.status(200).send(friendships);
  }



  async findAllByStatusForUser(req: FastifyRequest<{ Params: { userId: number; status: FriendshipStatus } }>, res: FastifyReply): Promise<void> {
    const { userId, status } = req.params;
    const friendships = await this.friendshipService.getAllByStatusForUser({ userId, status });
    res.status(200).send(friendships);
  }



  async isBlockedBy(req: FastifyRequest<{ Params: { blocker_id: number; target_id: number } }>, res: FastifyReply): Promise<void> {
    const { blocker_id, target_id } = req.params;
    req.log.info(`Checking if user ${blocker_id} has blocked user ${target_id}`);
    const blocked = await this.friendshipService.isBlockedBy({ blocker_id, target_id });
    res.status(200).send({ blocked });
  }

  async blockUser(req: FastifyRequest<{ Body: { blocker_id: number; blocked_id: number } }>, res: FastifyReply): Promise<void> {
    const { blocker_id, blocked_id } = req.body;
    req.log.info(`User ${blocker_id} blocking user ${blocked_id}`);
    const friendship = await this.friendshipService.blockUser({ blocker_id, blocked_id });
    res.status(200).send(friendship);
  }

  async unblockUser(req: FastifyRequest<{ Body: { blocker_id: number; blocked_id: number } }>, res: FastifyReply): Promise<void> {
    const { blocker_id, blocked_id } = req.body;
    req.log.info(`User ${blocker_id} unblocking user ${blocked_id}`);
    try {
      await this.friendshipService.unblockUser({ blocker_id, blocked_id });
    } catch (e) {
      if (e instanceof Error.FriendshipNotFoundError) {
        res.status(404).send({ message: 'Block relationship not found' });
        return;
      }
      if (e instanceof Error.NotAuthorizedError) {
        res.status(403).send({ message: 'Only the user who blocked can unblock' });
        return;
      }
      throw e;
    }
    res.status(200).send({ message: 'User unblocked' });
  }
}
