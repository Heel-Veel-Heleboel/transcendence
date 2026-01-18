export interface CreateRefreshTokenDto {
  id: string,
  user_id: number,
  refreshToken: string
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
  refreshToken: string;
  hashedRefreshToken: string;
}