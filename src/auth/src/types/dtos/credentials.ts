export interface CreatePasswordDto {
  user_id: number,
  password: string
}

export interface UpdatePasswordDto {
  user_id: number,
  newPassword: string
}

export interface DeletePasswordDto {
  user_id: number
}

export interface FindPasswordDto {
  user_id: number
}