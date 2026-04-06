import { AxiosResponse } from 'axios';

export interface IUserStatus {
  activity_status: string;
  name: string;
}

export interface IUser {
  id: number;
  email: string;
  name: string;
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
  getProfile: () => Promise<AxiosResponse>;
  getProfileAvatar: (url: string) => Promise<AxiosResponse>;
  setProfileAvatar: (data: FormData) => Promise<AxiosResponse>;
  setUsername: (user_name: string) => Promise<AxiosResponse>;
  setEmail: (user_email: string) => Promise<AxiosResponse>;
  deleteUser: () => Promise<AxiosResponse>;
}
