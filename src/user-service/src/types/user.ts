// export interface SafeUser = Omit<User, 'password'>;

// export type CreateUserData = Pick<User, 'email' | 'username' | 'password'>;


export interface CreateUserData {
  email: string,
  username: string;
  password: string;
}

export interface LoginUserData {
  email: string;
  password: string;
}


export interface SafeUser {
  id: number;
  email: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  token: string;
  user: SafeUser;
  expiresIn: string;
}
