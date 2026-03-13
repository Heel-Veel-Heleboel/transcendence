import { FriendshipRepository } from '../repositories/friendship.js';
import { Friendship } from '../../generated/prisma/client.js';
import { 
  CreateFriendshipDto,
  DeleteFriendshipDto,
  UpdateFriendshipStatusDto,
  GetFriendshipDto,
  FindAllForUserDto,
  IsBlockedDto,
  FindAllByStatusForUserDto
} from '../dto/friendship.js';
import { ApiGatewayClient, WebSocketEvent  } from '../client/api-gateway.js';



export class FriendshipService {
  constructor(
    private readonly friendshipRepository: FriendshipRepository,
    private readonly apiGatewayClient: ApiGatewayClient
  ) {}



  private async normalizeUserIds(userId1: number, userId2: number): Promise<[number, number]> {
    return userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
  }



  async createFriendship(data: CreateFriendshipDto): Promise<void> {
    const { user1_id, user2_id } = data;
    const [userId1, userId2] = await this.normalizeUserIds(user1_id, user2_id);

    const friendship = await this.friendshipRepository.create({ user1_id: userId1, user2_id: userId2 });

    const event: WebSocketEvent = {
      type: 'FRIENDSHIP_REQUEST',
      friendship_id: friendship.id
    };
    await this.apiGatewayClient.notifyAddressee(user2_id, event);
  }



  async deleteFriendship(data: DeleteFriendshipDto): Promise<void> {
    await this.friendshipRepository.delete({ id: data.id });
  }



  async updateFriendshipStatus(data: UpdateFriendshipStatusDto): Promise<Friendship> {
    return this.friendshipRepository.updateStatus({ id: data.id, status: data.status }); 
  }



  async getFriendship(data: GetFriendshipDto): Promise<Friendship | null> {
    return this.friendshipRepository.findById({ id: data.id });
  }



  async getUserFriendships(data: FindAllForUserDto): Promise<Friendship[]> {
    return this.friendshipRepository.findAllForUser({ userId: data.userId });
  }



  async getAllByStatusForUser(data: FindAllByStatusForUserDto): Promise<Friendship[]> {
    return this.friendshipRepository.findAllByStatusForUser({ userId: data.userId, status: data.status });
  }
  
  

  async isBlocked(data: IsBlockedDto): Promise<boolean> {
    const [normalizedUserId1, normalizedUserId2] = await this.normalizeUserIds(data.userId1, data.userId2);
    return this.friendshipRepository.isBlocked({ userId1: normalizedUserId1, userId2: normalizedUserId2 });
  }
}