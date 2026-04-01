import { AxiosRequestConfig } from 'axios';

export class AuthService {
  private base: string;

  constructor() {
    this.base = 'auth';
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

  postLogOut() {
    const config = {
      url: this.base + '/logout',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    } as AxiosRequestConfig;
    return config;
  }

  postRefresh() {
    const config = {
      url: this.base + '/refresh',
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
