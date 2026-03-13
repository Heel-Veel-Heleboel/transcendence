import { FriendshipStatus } from '../../generated/prisma/client.js';

export interface CreateFriendshipDto {
  user1_id: number;
  user2_id: number;
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



export interface FindByUsersDto {
  userId1: number;
  userId2: number;
}



export interface FindAllForUserDto {
  userId: number;
}



export interface FindAllByStatusForUserDto {
  userId: number;
  status: FriendshipStatus;
}



export interface IsBlockedDto {
  userId1: number;
  userId2: number;
}
