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

export interface FindPasswordDto {
  userId: number
}