export interface CreateRefreshTokenDto {
  id: string,
  userId: number,
  refreshToken: string
}

export interface RevokeRefreshTokenDto {
  id: string
}

export interface FindRefreshTokenDto {
  id: string
}


export interface GeneratedRefreshTokenDto {
  id: string;
  refreshToken: string;
  hashedRefreshToken: string;
}