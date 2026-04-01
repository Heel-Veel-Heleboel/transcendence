import { AxiosRequestConfig } from 'axios';
import { UseAxiosResult } from 'axios-hooks';

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
  postProfileAvatar: () => any;
  patchUsername: () => any;
  patchEmail: () => any;
  deleteUser: () => any;
}
