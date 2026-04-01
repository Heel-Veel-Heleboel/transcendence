import { AxiosRequestConfig } from 'axios';

export class AuthService {
  private base: string;

  constructor() {
    this.base = 'auth';
  }

  postLogIn() {
    const config = {
      url: this.base + '/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    } as AxiosRequestConfig;
    return config;
  }

  postRegister() {
    const config = {
      url: this.base + '/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    } as AxiosRequestConfig;
    return config;
  }

  putPassword() {
    const config = {
      url: this.base + '/change-password',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    } as AxiosRequestConfig;
    return config;
  }
}
