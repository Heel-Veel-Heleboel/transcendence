import { IUser } from './user';

export interface IFriendship {
  created_at: string;
  id: number;
  status: string;
  updated_at: string;
  // The other user in the relationship
  userId: number;
  userName: string;
  // True if current user sent the request / is the blocker
  isRequester: boolean;
}

export interface IFriendshipResponse {
  created_at: string;
  id: number;
  status: string;
  updated_at: string;
  requester_id: number;
  addressee_id: number;
  requester: IUser;
  addressee: IUser;
}

export interface IFriendshipBetween {
  userId1: string;
  userId2: string;
}

export interface ISetFriendshipStatus {
  id: string;
  status: string;
  addressee_id?: number;
}

export interface IBlockUser {
  blocker_id: number;
  blocked_id: number;
}

export interface ICancelRequest {
  friendship_id: number;
  requester_id: number;
}

export const FriendshipStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  BLOCKED: 'BLOCKED'
};

export function responseToFriendship(
  response: IFriendshipResponse,
  currentUserId: number
): IFriendship {
  const isRequester = currentUserId === response.requester_id;
  return {
    created_at: response.created_at,
    id: response.id,
    status: response.status,
    updated_at: response.updated_at,
    userId: isRequester ? response.addressee_id : response.requester_id,
    userName: isRequester ? response.addressee.name : response.requester.name,
    isRequester,
  };
}
