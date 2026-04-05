import { AxiosRequestConfig } from 'axios';
import api from './api';
import { IChangePassword, ICredentials, ILogin } from '../types/auth';

export class AuthService {
  private base: string;

  constructor() {
    this.base = 'auth';
  }

  async register(data: ICredentials) {
    const config = {
      url: this.base + '/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(data)
    } as AxiosRequestConfig;
    const result = await api(config);
    return result;
  }

  async login(data: ILogin) {
    const config = {
      url: this.base + '/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(data)
    } as AxiosRequestConfig;
    const result = await api(config);
    return result;
  }

  async logout(data: { user_id: string }) {
    const config = {
      url: this.base + '/logout',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(data)
    } as AxiosRequestConfig;
    const result = await api(config);
    return result;
  }

  async refresh(data: { user_id: string }) {
    const config = {
      url: this.base + '/refresh',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(data)
    } as AxiosRequestConfig;
    const result = await api(config);
    return result;
  }

  async changePassword(data: IChangePassword) {
    const config = {
      url: this.base + '/change-password',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      data: data
    } as AxiosRequestConfig;
    const result = await api(config);
    return result;
  }
}
