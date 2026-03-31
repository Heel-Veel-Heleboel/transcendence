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
  getUser: () => AxiosRequestConfig;
  getProfile: () => AxiosRequestConfig;
  getProfileAvatar: (url: string) => AxiosRequestConfig;
  postProfileAvatar: () => AxiosRequestConfig;
  patchUsername: () => AxiosRequestConfig;
}
