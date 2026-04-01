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
}

export interface IAuthService {
  putPassword: () => AxiosRequestConfig;
}
