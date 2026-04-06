import { AxiosRequestConfig } from 'axios';
import api from './api';
import {
  ISetPassword,
  ICredentials,
  ILogin,
  ITwoFactor,
  IVerifyTwoFactor
} from '../types/auth';

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
    const response = await api(config);
    return response;
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
    const response = await api(config);
    return response;
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
    const response = await api(config);
    return response;
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
    const response = await api(config);
    return response;
  }

  async setTwoFactor(data: ITwoFactor) {
    const config = {
      url: this.base + '/setup-2fa',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(data)
    } as AxiosRequestConfig;
    const response = await api(config);
    return response;
  }

  async verifyTwoFactor(data: IVerifyTwoFactor) {
    const config = {
      url: this.base + '/verify-2fa',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(data)
    } as AxiosRequestConfig;
    const response = await api(config);
    return response;
  }

  async isTwoFactor(data: { user_id: number }) {
    const config = {
      url: this.base + '/isEnabled',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(data)
    } as AxiosRequestConfig;
    const response = await api(config);
    return response;
  }

  async setPassword(data: ISetPassword) {
    const config = {
      url: this.base + '/change-password',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      data: data
    } as AxiosRequestConfig;
    const response = await api(config);
    return response;
  }
}
