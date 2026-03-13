import { Friendship } from '../../../generated/prisma/client.js';
import{
  CreateFriendshipDto,
  DeleteFriendshipDto,
  GetFriendshipDto,
  UpdateFriendshipStatusDto,
  FindAllForUserDto,
  FindAllByStatusForUserDto,
  IsBlockedDto
} from '../../dto/friendship.js';

export interface IFriendshipRepository {
  create(data: CreateFriendshipDto): Promise<Friendship>;
  delete(data: DeleteFriendshipDto): Promise<void>;
  updateStatus(data: UpdateFriendshipStatusDto): Promise<Friendship>;
  findById(data: GetFriendshipDto): Promise<Friendship | null>;
  findAllForUser(data: FindAllForUserDto): Promise<Friendship[]>;
  findAllByStatusForUser(data: FindAllByStatusForUserDto): Promise<Friendship[]>;
  isBlocked(data: IsBlockedDto): Promise<boolean>;
}