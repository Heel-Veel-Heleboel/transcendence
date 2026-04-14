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
  requester_id?: number;
  addressee_id?: number;
}



export interface GetFriendshipDto {
  id: number;
}



export interface FriendshipDto {
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
  blocker_id: number;
  target_id: number;
}



export interface BlockUserDto {
  blocker_id: number;
  blocked_id: number;
}
