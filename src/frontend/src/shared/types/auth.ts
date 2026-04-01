import { AxiosRequestConfig } from 'axios';
import { ResponseValues } from 'axios-hooks';

export interface ICredentials {
  email: string;
  user_name: string;
  password: string;
}

export interface IAuthContext {
  token: string | null;
  userId: string;
  register: (
    credentials: ICredentials
  ) => Promise<ResponseValues<any, any, any>>;
  logIn: (credentials: ICredentials) => Promise<ResponseValues<any, any, any>>;
  logOut: Function;
  refresh: Function;
  gotoLogin: Function;
  service: IAuthService;
}

export interface IAuthService {
  putPassword: () => AxiosRequestConfig;
  postRegister: () => AxiosRequestConfig;
}
