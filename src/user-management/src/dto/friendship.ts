import { FriendshipStatus } from '../../generated/prisma/client.js';

export interface CreateFriendshipDto {
  requester_id: number;
  addressee_id: number;
  status?: FriendshipStatus;
}

export interface DeleteFriendshipDto {
  id: number;
}

export interface UpdateFriendshipStatusDto {
  id: number;
  status: FriendshipStatus;
}

export interface GetFriendshipDto {
  id: number;
}

export interface FindFriendshipDto {
  id?: number;
  requester_id?: number;
  addressee_id?: number;
  status?: FriendshipStatus;
  user_id?: number; // For finding friendships involving a specific user
}

export interface FindByUsersDto {
  userId1: number;
  userId2: number;
}

export interface FindAllForUserDto {
  userId: number;
}

export interface FindAllPendingForUserDto {
  userId: number;
}

export interface FindAllAcceptedForUserDto {
  userId: number;
}

export interface FindAllBlockedForUserDto {
  userId: number;
}

export interface IsBlockedDto {
  userId1: number;
  userId2: number;
}
