import { UserManagementService } from '../types/user-management-service.js';

export class UserManagementClient implements UserManagementService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  async createUser(email: string, username: string): Promise<number> {
    const response = await fetch(`${this.baseUrl}/users/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_email: email,
        user_name: username,
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create user');
    }

    const data = await response.json();
    return data.user_id;
  }

  async findByUserId(user_id: number): Promise<{ id: number; email: string; username: string } | null> {
    const response = await fetch(`${this.baseUrl}/users/${user_id}`, {
      method: 'GET',
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to find user');
    }

    const user = await response.json();
    return {
      id: user.user_id,
      email: user.user_email,
      username: user.user_name,
    };
  }

  async findUserByEmail(email: string): Promise<{ id: number; email: string; username: string } | null> {
    const response = await fetch(`${this.baseUrl}/users/email/${encodeURIComponent(email)}`, {
      method: 'GET',
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to find user by email');
    }

    const user = await response.json();
    return {
      id: user.user_id,
      email: user.user_email,
      username: user.user_name,
    };
  }

  async deleteUser(user_id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/users/${user_id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete user');
    }
  }
}