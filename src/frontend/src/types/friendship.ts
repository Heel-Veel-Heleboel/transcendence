import { IUser } from './profile';

export interface IFriendship {
  created_at: string;
  id: number;
  status: string;
  updated_at: string;
  userId: number;
  userName: string;
}

export interface IFriendshipResponse {
  created_at: string;
  id: number;
  status: string;
  updated_at: string;
  user1_id: number;
  user2_id: number;
  user1: IUser;
  user2: IUser;
}

export function responseToFriendship(response: IFriendshipResponse, userId: number) {
  return {
    created_at: response.created_at,
    id: response.id,
    status: response.status,
    updated_at: response.updated_at,
    userId: userId === response.user1_id ? response.user2_id : response.user1_id,
    userName: userId === response.user1_id ? response.user2.name : response.user1.name
  };
}
