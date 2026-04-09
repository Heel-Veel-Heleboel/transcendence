import { AxiosRequestConfig } from 'axios';
import api from './api';
import { IDeleteUser, IGetUser, ISetEmail, ISetUsername } from '../types/user';
import {
  IGetProfile,
  IGetProfileAvatar,
  ISetProfileAvatar
} from '../types/profile';
import { IFriendshipBetween, ISetFriendshipStatus } from '../types/friendship';

export class UserService {
  private base: string;

  constructor() {
    this.base = 'users';
  }

  async getUser(data: IGetUser) {
    const config = {
      url: this.base + '/find-by-id/' + data.userId,
      method: 'GET'
    } as AxiosRequestConfig;
    const response = await api(config);
    return response;
  }

  async getProfile(data: IGetProfile) {
    const config = {
      url: this.base + '/profile/find-by-id/' + data.userId,
      method: 'GET'
    } as AxiosRequestConfig;
    const response = await api(config);
    return response;
  }

  async getProfileAvatar(data: IGetProfileAvatar) {
    const config = {
      url: this.base + data.avatarUrl,
      method: 'GET',
      responseType: 'blob'
    } as AxiosRequestConfig;
    const response = await api(config);
    return response;
  }

  async getFriendship(data: IFriendshipBetween) {
    const config = {
      url: this.base + `/friendship/between/${data.userId1}/${data.userId2}`,
      method: 'GET'
    } as AxiosRequestConfig;
    const response = await api(config);
    return response;
  }

  async setFriendship(data: IFriendshipBetween) {
    const config = {
      url: this.base + '/friendship/create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({ user1_id: data.userId1, user2_id: data.userId2 })
    } as AxiosRequestConfig;
    const response = await api(config);
    return response;
  }

  async setFriendshipStatus(data: ISetFriendshipStatus) {
    const config = {
      url: this.base + '/friendship/update-status',
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({ id: data.id, status: data.status })
    } as AxiosRequestConfig;
    const response = await api(config);
    return response;
  }

  async setProfileAvatar(data: ISetProfileAvatar) {
    const config = {
      url: this.base + '/profile/upload-avatar/' + data.userId,
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      data: data.data
    } as AxiosRequestConfig;
    const response = await api(config);
    return response;
  }

  async setUsername(data: ISetUsername) {
    const config = {
      url: this.base + '/update-name',
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(data)
    } as AxiosRequestConfig;
    const response = await api(config);
    return response;
  }

  async setEmail(data: ISetEmail) {
    const config = {
      url: this.base + '/update-email',
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(data)
    } as AxiosRequestConfig;
    const response = await api(config);
    return response;
  }

  async deleteUser(data: IDeleteUser) {
    const config = {
      url: this.base + '/delete',
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({ user_id: Number(data.user_id) })
    } as AxiosRequestConfig;
    const response = await api(config);
    return response;
  }
}
