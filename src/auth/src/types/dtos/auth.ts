export interface SafeUserDto {
  id: number;
  name: string;
  email: string;
}

export interface LoggedInUserDto extends SafeUserDto {
  accessToken: string;
  refreshToken: string;
}

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