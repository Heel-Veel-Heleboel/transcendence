export interface CreateRefreshTokenDto {
  id: string,
  user_id: number,
  hashed_refresh_token: string
}

export interface RevokeRefreshTokenDto {
  id: string
}

export interface RevokeAllDto {
  user_id: number
}

export interface FindRefreshTokenDto {
  id: string
}


export interface GeneratedRefreshTokenDto {
  id: string;
  refresh_token: string;
  hashed_refresh_token: string;
}