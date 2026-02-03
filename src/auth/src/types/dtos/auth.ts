
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
  new_refresh_token: string;
}
