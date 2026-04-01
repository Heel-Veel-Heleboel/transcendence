import { AxiosRequestConfig } from 'axios';

export interface IUserStatus {
  activity_status: string;
  name: string;
}

export interface IUser {
  id: number;
  email: string;
  name: string;
}

export interface IUserService {
  getUser: () => any;
  getProfile: () => any;
  getProfileAvatar: (url: string) => any;
  postProfileAvatar: (config: AxiosRequestConfig) => any;
  patchUsername: (config: AxiosRequestConfig) => any;
  patchEmail: (config: AxiosRequestConfig) => any;
  deleteUser: (config: AxiosRequestConfig) => any;
}
