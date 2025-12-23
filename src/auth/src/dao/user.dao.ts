import { SafeUserDto, CreateUserDto, UpdatePasswordDto, UpdateRefreshTokenDto } from './user.dto.js';


/** * Defines the shape of the User Data Access Object (DAO).
 * This interface outlines the methods for interacting with user data,
 * including creating users, updating passwords, and retrieving user information
 * by ID or email.
 */
export interface UserDaoShape {
  create(data: CreateUserDto): Promise<SafeUserDto>;
  updatePassword(id: number, data: UpdatePasswordDto): Promise<void>;
  updateRefreshToken(id: number, data: UpdateRefreshTokenDto): Promise<void>;
  findById(id: number): Promise<SafeUserDto | null>;
  findByEmail(email: string): Promise<SafeUserDto | null>;
};
