import { AxiosRequestConfig } from 'axios';

export interface ICredentials {
  email: string;
  user_name: string;
  password: string;
}

export interface IAuthContext {
  IsAuthenticated: boolean;
  userId: string;
  token: string;
  register: (credentials: ICredentials) => Promise<void>;
  logIn: (credentials: ICredentials) => Promise<void>;
  logOut: Function;
  refresh: Function;
  putPassword: (config: AxiosRequestConfig) => Promise<void>;
}
