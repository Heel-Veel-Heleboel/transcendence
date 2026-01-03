export interface CreateRefreshTokenDto {
  userId: number,
  refreshToken: string,
}

export interface RevokeRefreshTokenDto {
  tokenId: string
}

export interface FindRefreshTokenDto {
  tokenId: string
}

export interface DeleteAllForUser {
  userId: number
}