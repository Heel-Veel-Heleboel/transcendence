import { UserManagementShape } from '../../contracts/user-management.js';

/**
 * A mock implementation of UserManagementShape for testing purposes.
 * This mock simulates user management operations in memory.
 * It does not persist data and is intended for use in unit tests.
 * Methods:
 * - createUser: Simulates creating a user and returns a mock user ID.
 * - findUserById: Simulates finding a user by ID and returns mock user data or null.
 * - findUserByEmail: Simulates finding a user by email and returns mock user data or null.
 * - deleteUser: Simulates deleting a user by ID.
 */

export class UserManagementMock implements UserManagementShape {
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
    const userId = this.currentId++;
    this.users.set(userId, { id: userId, email, username });
    return userId;
  }

  async findUserById(userId: number): Promise<{ id: number; email: string; username: string } | null> {
    return this.users.get(userId) || null;
  }

  async findUserByEmail(email: string): Promise<{ id: number; email: string; username: string } | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async deleteUser(userId: number): Promise<void> {
    this.users.delete(userId);
  }
}