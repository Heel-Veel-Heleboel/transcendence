import { AxiosRequestConfig } from 'axios';

export class AuthService {
  private base: string;

  constructor() {
    this.base = 'auth/';
  }

  putPassword() {
    const config = {
      url: this.base + 'change-password',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    } as AxiosRequestConfig;
    return config;
  }
}
