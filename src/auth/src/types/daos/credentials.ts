
import { UpdatePasswordDto, CreatePasswordDto, DeletePasswordDto, FindPasswordDto } from '../dtos/credentials.js';


/**
 * Data Access Object (DAO) interface for managing user credentials.
 * Defines methods for creating, updating, finding, and deleting user passwords.
 * Methods:
 * - create: Creates a new user password record.
 * - updatePassword: Updates an existing user's password. 
 * - findByUserId: Finds a user's password by their user ID.
 * - deleteByUserId: Deletes a user's password record by their user ID.
 */
export interface CredentialsDaoShape {
  create(data: CreatePasswordDto): Promise<void>;
  updatePassword(data: UpdatePasswordDto): Promise<void>;
  findByUserId(data: FindPasswordDto): Promise<string | null>;
  deleteByUserId(data: DeletePasswordDto): Promise<void>;
}