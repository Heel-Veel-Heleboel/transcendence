import { AxiosRequestConfig } from 'axios';

export class UserService {
  private base: string;

  constructor() {
    this.base = 'users/';
  }

  getUser(userId: string) {
    const config = {
      url: this.base + 'find-by-id/' + userId
    } as AxiosRequestConfig;
    return config;
  }

  getProfile(userId: string) {
    const config = {
      url: this.base + 'profile/find-by-id/' + userId
    } as AxiosRequestConfig;
    return config;
  }

  getProfileAvatar(avatarUrl: string) {
    const config = {
      url: this.base + avatarUrl,
      responseType: 'blob'
    } as AxiosRequestConfig;
    return config;
  }

  postProfileAvatar(userId: string) {
    const config = {
      url: this.base + 'profile/upload-avatar/' + userId,
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    } as AxiosRequestConfig;
    return config;
  }

  patchUsername() {
    const config = {
      url: this.base + 'update-name',
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      }
    } as AxiosRequestConfig;
    return config;
  }
}
