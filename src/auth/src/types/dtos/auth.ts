//returning interfaces related to authentication operations
export interface SafeUserDto {
  id: number;
  name: string;
  email: string;
}

export interface LoggedInUserDto extends SafeUserDto {
  access_token: string;
  refresh_token: string;
}


export interface RefreshedTokensDto {
  access_token: string;
  refresh_token: string;
}

//incoming dtos for auth operations

export interface LogoutDto {
  user_id: number;
  refresh_token: string;
}

export interface RefreshDto  {
  user_id: number;
  refresh_token: string;
}

export interface ChangePasswordDto {
  user_id: number;
  current_password: string;
  new_password: string;
}