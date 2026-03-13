import { FriendshipService } from '../services/friendship.js';
import { FastifyRequest , FastifyReply } from 'fastify';
import { FriendshipStatus } from '../../generated/prisma/client.js';

export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) {}

  async createFriendship(req: FastifyRequest<{ Body: { user1_id: number; user2_id: number, status?:  FriendshipStatus } }>, res: FastifyReply): Promise<void> {
    const { user1_id, user2_id } = req.body;

    req.log.info(`Creating friendship between user ${user1_id} and user ${user2_id}`);
    await this.friendshipService.createFriendship({ user1_id, user2_id });
    req.log.info(`Friendship request sent from user ${user1_id} to user ${user2_id}`);
    res.status(201).send({ message: 'Friendship request sent' });
  }



  async deleteFriendship(req: FastifyRequest<{ Body: { id: number } }>, res: FastifyReply): Promise<void> {
    const { id } = req.body;
    req.log.info(`Deleting friendship with id ${id}`);
    await this.friendshipService.deleteFriendship({ id });
    req.log.info(`Friendship with id ${id} deleted`);
    res.status(200).send({ message: 'Friendship deleted' });
  }



  async updateFriendshipStatus(req: FastifyRequest<{ Body: { id: number; status: FriendshipStatus } }>, res: FastifyReply): Promise<void> {
    const { id, status } = req.body;
    req.log.info(`Updating friendship with id ${id} to status ${status}`);
    const updatedFriendship = await this.friendshipService.updateFriendshipStatus({ id, status });
    req.log.info(`Friendship with id ${id} updated to status ${status}`);
    res.status(200).send(updatedFriendship);
  }



  async getFriendship(req: FastifyRequest<{ Params: { id: number } }>, res: FastifyReply): Promise<void> {
    const { id } = req.params;
    req.log.info(`Retrieving friendship with id ${id}`);
    const friendship = await this.friendshipService.getFriendship({ id });
    if (!friendship) {
      req.log.warn(`Friendship with id ${id} not found`);
      res.status(404).send({ message: 'Friendship not found' });
      return;
    }
    req.log.info(`Friendship with id ${id} retrieved successfully`);
    res.status(200).send(friendship);
  }




  async findAllForUser(req: FastifyRequest<{ Params: { userId: number } }>, res: FastifyReply): Promise<void> {
    const { userId } = req.params;
    req.log.info(`Retrieving all friendships for user ${userId}`);
    const friendships = await this.friendshipService.getUserFriendships({ userId });
    req.log.info(`Retrieved ${friendships.length} friendships for user ${userId}`);
    res.status(200).send(friendships);
  }



  async findAllByStatusForUser(req: FastifyRequest<{ Params: { userId: number; status: FriendshipStatus } }>, res: FastifyReply): Promise<void> {
    const { userId, status } = req.params;
    req.log.info(`Retrieving all friendships with status ${status} for user ${userId}`);
    const friendships = await this.friendshipService.getUserFriendships({ userId });
    req.log.info(`Retrieved ${friendships.length} friendships with status ${status} for user ${userId}`);
    res.status(200).send(friendships);
  }



  async isBlocked(req: FastifyRequest<{ Params: { userId1: number; userId2: number } }>, res: FastifyReply): Promise<void> {
    const { userId1, userId2 } = req.params;
    req.log.info(`Checking if user ${userId1} has blocked user ${userId2}`);
    const blocked = await this.friendshipService.isBlocked({ userId1, userId2 });
    req.log.info(`User ${userId1} has ${blocked ? '' : 'not '}blocked user ${userId2}`);
    res.status(200).send({ blocked });
  }
}