
/**
 * Interface defining the contract for user management operations.
 * Methods:
 * - createUser: Creates a new user with the given email and username, returning the user ID.
 * - findByUserId: Finds a user by their ID, returning user details or null if not found.
 * - findUserByEmail: Finds a user by their email, returning user details or null if not found.
 * - deleteUser: Deletes a user by their ID.
 */
export interface UserManagementService {
  createUser(email: string, username: string): Promise<number>;
  findByUserId(user_id: number): Promise<{ id: number; email: string; username: string } | null>;
  findUserByEmail(email: string): Promise<{ id: number; email: string; username: string } | null>;
}