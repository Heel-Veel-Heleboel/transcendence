import { AxiosResponse } from 'axios';
import { IBlockUser, ICancelRequest, IFriendship, ISetFriendshipStatus } from './friendship';

export interface IUserStatus {
  activity_status: string;
  name: string;
}

export interface IUser {
  id: number;
  email: string;
  name: string;
  activity_status?: string;
}

export interface IGetUser {
  userId: string;
}

export interface ISetUsername {
  user_id: string;
  user_name: string;
}

export interface ISetEmail {
  user_id: string;
  user_email: string;
}

export interface IDeleteUser {
  user_id: string;
}

export interface IUserService {
  getUser: () => Promise<AxiosResponse>;
  getUserByName: (name: string) => Promise<IUser>;
  getProfile: (userId: string) => Promise<AxiosResponse>;
  getProfileAvatar: (url: string) => Promise<AxiosResponse>;
  getFriendship: (userId: string) => Promise<IFriendship | null>;
  setFriendship: (userId: string) => Promise<AxiosResponse>;
  setFriendshipStatus: (data: ISetFriendshipStatus) => Promise<AxiosResponse>;
  cancelFriendshipRequest: (data: ICancelRequest) => Promise<AxiosResponse>;
  blockUser: (data: IBlockUser) => Promise<AxiosResponse>;
  unblockUser: (data: IBlockUser) => Promise<AxiosResponse>;
  setProfileAvatar: (data: FormData) => Promise<AxiosResponse>;
  setUsername: (user_name: string) => Promise<AxiosResponse>;
  setEmail: (user_email: string) => Promise<AxiosResponse>;
  deleteUser: () => Promise<AxiosResponse>;
}
