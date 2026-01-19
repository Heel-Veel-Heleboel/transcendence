import { UserManagementService } from '../../types/user-management-service.js';

/**
 * A mock implementation of UserManagementService for testing purposes.
 * This mock simulates user management operations in memory.
 * It does not persist data and is intended for use in unit tests.
 * Methods:
 * - createUser: Simulates creating a user and returns a mock user ID.
 * - findByuser_id: Simulates finding a user by ID and returns mock user data or null.
 * - findUserByEmail: Simulates finding a user by email and returns mock user data or null.
 * - deleteUser: Simulates deleting a user by ID.
 */

export class UserManagementMock implements UserManagementService {
  private users: Map<number, { id: number; email: string; username: string }> = new Map();
  private currentId = 1;

  async createUser(email: string, username: string): Promise<number> {
    if (!email || !username) {
      throw new Error('Email and username are required to create a user.');
    }
    for (const user of this.users.values()) {
      if (user.email === email) {
        throw new Error('A user with this email already exists.');
      }
    }
    const user_id = this.currentId++;
    this.users.set(user_id, { id: user_id, email, username });
    return user_id;
  }

  async findByUserId(user_id: number): Promise<{ id: number; email: string; username: string } | null> {
    return this.users.get(user_id) || null;
  }

  async findUserByEmail(email: string): Promise<{ id: number; email: string; username: string } | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async deleteUser(user_id: number): Promise<void> {
    this.users.delete(user_id);
  }
}