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

//incoming dtos for auth operations

export interface LogoutDto {
  user_id: number;
  refreshToken: string;
}

export interface RefreshDto  {
  user_id: number;
  refreshToken: string;
}

export interface ChangePasswordDto {
  user_id: number;
  currentPassword: string;
  newPassword: string;
}