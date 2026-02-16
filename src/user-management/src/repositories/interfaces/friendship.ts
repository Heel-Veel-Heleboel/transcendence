import { Friendship } from '../../../generated/prisma/client.js';
import{
  CreateFriendshipDto,
  DeleteFriendshipDto,
  GetFriendshipDto,
  UpdateFriendshipStatusDto,
  FindByUsersDto,
  FindAllForUserDto,
  FindAllPendingForUserDto,
  FindAllAcceptedForUserDto,
  FindAllBlockedForUserDto,
  IsBlockedDto
} from '../../dto/friendship.js';

export interface IFriendshipRepository {
  create(data: CreateFriendshipDto): Promise<Friendship>;
  delete(data: DeleteFriendshipDto): Promise<void>;
  updateStatus(data: UpdateFriendshipStatusDto): Promise<Friendship>;
  findById(data: GetFriendshipDto): Promise<Friendship | null>;
  findByUsers(data: FindByUsersDto): Promise<Friendship | null>;
  findAllForUser(data: FindAllForUserDto): Promise<Friendship[]>;
  findAllPendingForUser(data: FindAllPendingForUserDto): Promise<Friendship[]>;
  findAllAcceptedForUser(data: FindAllAcceptedForUserDto): Promise<Friendship[]>;
  findAllBlockedForUser(data: FindAllBlockedForUserDto): Promise<Friendship[]>;
  findAll(): Promise<Friendship[]>;
  isBlocked(data: IsBlockedDto): Promise<boolean>;
}