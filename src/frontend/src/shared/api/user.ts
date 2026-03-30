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
}
