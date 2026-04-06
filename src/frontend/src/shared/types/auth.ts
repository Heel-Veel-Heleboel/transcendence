import { AxiosResponse } from 'axios';

export interface ICredentials {
  email: string;
  user_name: string;
  password: string;
}

export interface ILogin {
  email: string;
  password: string;
  two_factor_token?: string;
}

export interface ISetPassword {
  user_id: string;
  current_password: string;
  new_password: string;
}

export interface ITwoFactor {
  user_id: number;
}

export interface IVerifyTwoFactor {
  user_id: number;
  token: string;
}

export interface IAuthContext {
  isAuthenticated: boolean | null;
  isLoading: boolean;
  userId: string;
  token: string;
  register: (data: ICredentials) => Promise<AxiosResponse>;
  logIn: (data: ILogin) => Promise<AxiosResponse>;
  logOut: () => Promise<AxiosResponse>;
  refresh: () => Promise<AxiosResponse>;
  setPassword: (data: {
    current_password: string;
    new_password: string;
  }) => Promise<AxiosResponse>;
  setTwoFactor: () => Promise<AxiosResponse>;
  verifyTwoFactor: (token: string) => Promise<AxiosResponse>;
}
