export interface CreatePasswordDto {
  userId: number,
  password: string
}

export interface UpdatePasswordDto {
  userId: number,
  newPassword: string
}

export interface DeletePasswordDto {
  userId: number
}

export interface findPasswordDto {
  userId: number
}







export interface CreateRefreshTokenDto {
  userId: number,
  refreshToken: string
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

