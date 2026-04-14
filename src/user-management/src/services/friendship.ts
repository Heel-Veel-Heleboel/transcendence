import { FriendshipRepository } from '../repositories/friendship.js';
import { Friendship } from '../../generated/prisma/client.js';
import {
  CreateFriendshipDto,
  DeleteFriendshipDto,
  UpdateFriendshipStatusDto,
  GetFriendshipDto,
  FindAllForUserDto,
  IsBlockedDto,
  FindAllByStatusForUserDto,
  FriendshipDto,
  BlockUserDto,
} from '../dto/friendship.js';
import { ApiGatewayClient, WebSocketEvent  } from '../client/api-gateway.js';
import * as Error from '../error/user-management.js';



export class FriendshipService {
  constructor(
    private readonly friendshipRepository: FriendshipRepository,
    private readonly apiGatewayClient: ApiGatewayClient
  ) {}



  async createFriendship(data: CreateFriendshipDto): Promise<void> {
    // Prevent sending a request to someone who has blocked you
    const blockedByAddressee = await this.friendshipRepository.isBlockedBy({
      blocker_id: data.addressee_id,
      target_id: data.requester_id
    });
    if (blockedByAddressee) {
      throw new Error.BlockedByUserError();
    }

    const friendship = await this.friendshipRepository.create({
      requester_id: data.requester_id,
      addressee_id: data.addressee_id,
    });

    const event: WebSocketEvent = {
      type: 'FRIENDSHIP_REQUEST',
      friendship_id: friendship.id
    };
    await this.apiGatewayClient.notifyAddressee(data.addressee_id, event);
  }



  async deleteFriendship(data: DeleteFriendshipDto): Promise<void> {
    await this.friendshipRepository.delete({ id: data.id });
  }

  // Cancel a pending outgoing request — only the original requester may do this
  async cancelFriendshipRequest(data: { friendship_id: number; requester_id: number }): Promise<void> {
    const friendship = await this.friendshipRepository.findById({ id: data.friendship_id });
    if (!friendship) {
      throw new Error.FriendshipNotFoundError();
    }
    if (friendship.status !== 'PENDING') {
      throw new Error.NotAuthorizedError();
    }
    if (friendship.requester_id !== data.requester_id) {
      throw new Error.NotAuthorizedError();
    }
    await this.friendshipRepository.delete({ id: data.friendship_id });
  }



  async updateFriendshipStatus(data: UpdateFriendshipStatusDto): Promise<Friendship> {
    if (data.status === 'ACCEPTED' || data.status === 'REJECTED') {
      const friendship = await this.friendshipRepository.findById({ id: data.id });
      if (!friendship) {
        throw new Error.FriendshipNotFoundError();
      }
      // Friendship must be PENDING before it can be accepted or rejected
      if (friendship.status !== 'PENDING') {
        throw new Error.NotAuthorizedError();
      }
      // addressee_id is required for these transitions — only the addressee may respond
      if (friendship.addressee_id !== data.addressee_id) {
        throw new Error.NotAuthorizedError();
      }
    }
    return this.friendshipRepository.updateStatus({ id: data.id, status: data.status });
  }



  async getFriendship(data: GetFriendshipDto): Promise<Friendship | null> {
    return this.friendshipRepository.findById({ id: data.id });
  }


  async getFriendshipBetween(data: FriendshipDto): Promise<Friendship | null> {
    return this.friendshipRepository.findBetween({ userId1: data.userId1, userId2: data.userId2 });
  }


  async getUserFriendships(data: FindAllForUserDto): Promise<Friendship[]> {
    return this.friendshipRepository.findAllForUser({ userId: data.userId });
  }



  async getAllByStatusForUser(data: FindAllByStatusForUserDto): Promise<Friendship[]> {
    return this.friendshipRepository.findAllByStatusForUser({ userId: data.userId, status: data.status });
  }



  // Directional: did blocker_id block target_id?
  async isBlockedBy(data: IsBlockedDto): Promise<boolean> {
    return this.friendshipRepository.isBlockedBy({ blocker_id: data.blocker_id, target_id: data.target_id });
  }

  // Block a user: sets requester=blocker. Deletes any existing relationship (including pending requests).
  async blockUser(data: BlockUserDto): Promise<Friendship> {
    return this.friendshipRepository.blockUser({ blocker_id: data.blocker_id, blocked_id: data.blocked_id });
  }

  // Unblock: only the original blocker can unblock. Queries directionally so there is no
  // ambiguity — if blocker_id did not create the block record, it won't be found.
  async unblockUser(data: { blocker_id: number; blocked_id: number }): Promise<void> {
    const friendship = await this.friendshipRepository.findDirectionalBlock(data.blocker_id, data.blocked_id);
    if (!friendship) {
      throw new Error.FriendshipNotFoundError();
    }
    await this.friendshipRepository.delete({ id: friendship.id });
  }
}
