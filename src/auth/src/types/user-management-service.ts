
/**
 * Interface defining the contract for user management operations.
 * Methods:
 * - createUser: Creates a new user with the given email and username, returning the user ID.
 * - findByUserId: Finds a user by their ID, returning user details or null if not found.
 * - findUserByEmail: Finds a user by their email, returning user details or null if not found.
 * - updateActivityStatus: Updates the activity status of a user.
 * - deleteUser: Deletes a user by their ID.
 */

export type ActivityStatus = 'ONLINE' | 'OFFLINE';

export interface UserManagementService {
  createUser(email: string, username: string): Promise<number>;
  findByUserId(user_id: number): Promise<{ id: number; email: string; username: string } | null>;
  findUserByEmail(email: string): Promise<{ id: number; email: string; username: string } | null>;
  updateActivityStatus(user_id: number, activity_status: ActivityStatus): Promise<void>;
  deleteUser(user_id: number): Promise<void>;
}