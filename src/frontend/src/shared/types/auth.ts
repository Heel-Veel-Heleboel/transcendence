import { AxiosRequestConfig } from 'axios';

export interface ICredentials {
  email: string;
  username: string;
  password: string;
}

export interface IAuthContext {
  token: string | null;
  userId: string;
  register: Function;
  logIn: Function;
  logOut: Function;
  refresh: Function;
  gotoLogin: Function;
  service: IAuthService;
}

export interface IAuthService {
  putPassword: () => AxiosRequestConfig;
}
