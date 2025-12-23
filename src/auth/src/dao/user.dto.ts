
/**
 * Data Transfer Objects related to User operations.
 * These interfaces define the structure of data used for creating users,
 * updating passwords, and representing safe user information.
 */
export  interface CreateUserDto {
  email: string;
  password: string;
  username: string;
}


export interface UpdatePasswordDto {
  password: string
}

export interface UpdateRefreshTokenDto {
  refreshToken: string | null
}

export interface SafeUserDto {
  id: number;
  email: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
};