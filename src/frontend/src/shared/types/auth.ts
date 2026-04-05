export interface ICredentials {
  email: string;
  user_name: string;
  password: string;
}

export interface ILogin {
  email: string;
  password: string;
}

export interface IChangePassword {
  user_id: string;
  current_password: string;
  new_password: string;
}

export interface IAuthContext {
  isAuthenticated: boolean | null;
  isLoading: boolean;
  userId: string;
  token: string;
  register: (data: ICredentials) => Promise<void>;
  logIn: (data: ILogin) => Promise<void>;
  logOut: Function;
  refresh: Function;
  changePassword: (data: IChangePassword) => Promise<void>;
}
