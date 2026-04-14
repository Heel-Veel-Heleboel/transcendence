import { Friendship } from '../../../generated/prisma/client.js';
import {
  CreateFriendshipDto,
  DeleteFriendshipDto,
  GetFriendshipDto,
  UpdateFriendshipStatusDto,
  FindAllForUserDto,
  FindAllByStatusForUserDto,
  IsBlockedDto,
  FriendshipDto,
  BlockUserDto,
} from '../../dto/friendship.js';

export interface IFriendshipRepository {
  create(data: CreateFriendshipDto): Promise<Friendship>;
  delete(data: DeleteFriendshipDto): Promise<void>;
  updateStatus(data: UpdateFriendshipStatusDto): Promise<Friendship>;
  findById(data: GetFriendshipDto): Promise<Friendship | null>;
  findBetween(data: FriendshipDto): Promise<Friendship | null>;
  findAllForUser(data: FindAllForUserDto): Promise<Friendship[]>;
  findAllByStatusForUser(data: FindAllByStatusForUserDto): Promise<Friendship[]>;
  isBlockedBy(data: IsBlockedDto): Promise<boolean>;
  findDirectionalBlock(blocker_id: number, blocked_id: number): Promise<Friendship | null>;
  blockUser(data: BlockUserDto): Promise<Friendship>;
}
