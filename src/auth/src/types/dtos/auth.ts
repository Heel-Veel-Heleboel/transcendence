//returning interfaces related to authentication operations
export interface SafeUserDto {
  id: number;
  name: string;
  email: string;
}

export interface LoggedInUserDto extends SafeUserDto {
  accessToken: string;
  refreshToken: string;
}


export interface RefreshedTokensDto {
  accessToken: string;
  refreshToken: string;
}

//argument dtos for auth operations
export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LogoutDto {
  userId: number;
  refreshToken: string;
}

export interface RefreshDto  {
  userId: number;
  refreshToken: string;
}