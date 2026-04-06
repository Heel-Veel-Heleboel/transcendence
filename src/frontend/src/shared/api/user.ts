import { AxiosRequestConfig } from 'axios';
import api from './api';
import { IDeleteUser, IGetUser, ISetEmail, ISetUsername } from '../types/user';
import {
  IGetProfile,
  IGetProfileAvatar,
  ISetProfileAvatar
} from '../types/profile';

export class UserService {
  private base: string;

  constructor() {
    this.base = 'users';
  }

  async getUser(data: IGetUser) {
    const config = {
      url: this.base + '/find-by-id/' + data.userId
    } as AxiosRequestConfig;
    const response = api(config);
    return response;
  }

  async getProfile(data: IGetProfile) {
    const config = {
      url: this.base + '/profile/find-by-id/' + data.userId
    } as AxiosRequestConfig;
    const response = api(config);
    return response;
  }

  async getProfileAvatar(data: IGetProfileAvatar) {
    const config = {
      url: this.base + data.avatarUrl,
      responseType: 'blob'
    } as AxiosRequestConfig;
    const response = api(config);
    return response;
  }

  setProfileAvatar(data: ISetProfileAvatar) {
    const config = {
      url: this.base + '/profile/upload-avatar/' + data.userId,
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      data: data.data
    } as AxiosRequestConfig;
    const response = api(config);
    return response;
  }

  setUsername(data: ISetUsername) {
    const config = {
      url: this.base + '/update-name',
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(data)
    } as AxiosRequestConfig;
    const response = api(config);
    return response;
  }

  setEmail(data: ISetEmail) {
    const config = {
      url: this.base + '/update-email',
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(data)
    } as AxiosRequestConfig;
    const response = api(config);
    return response;
  }

  deleteUser(data: IDeleteUser) {
    const config = {
      url: this.base + '/delete',
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({ user_id: Number(data.user_id) })
    } as AxiosRequestConfig;
    const response = api(config);
    return response;
  }
}
