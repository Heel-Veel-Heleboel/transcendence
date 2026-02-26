import { UserManagementService } from '../types/user-management-service.js';
import { serverInfo } from '../config/server-info.js';

interface CreateUserResponse {
  user_id: number;
}

interface UserResponse {
  id: number;
  email: string;
  name: string;
}

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  details?: Array<{ path: string; message: string }>;
}

export class UserManagementClient implements UserManagementService {
  private baseUrl: string;

  constructor(baseUrl: string = serverInfo.USER_MANAGEMENT_URL) {
    this.baseUrl = baseUrl;
  }

  async createUser(email: string, username: string): Promise<number> {
    const response = await fetch(`${this.baseUrl}/users/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_email: email,
        user_name: username
      })
    });

    if (!response.ok) {
      const error = await response.json() as ErrorResponse;
      throw new Error(error.message || 'Failed to create user');
    }

    const data = await response.json() as CreateUserResponse;
    return data.user_id;
  }

  async findByUserId(user_id: number): Promise<{ id: number; email: string; username: string } | null> {
    const response = await fetch(`${this.baseUrl}/users/find-by-id/${user_id}`, {
      method: 'GET'
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json() as ErrorResponse;
      throw new Error(error.message || 'Failed to find user');
    }

    const user = await response.json() as UserResponse;
    return {
      id: user.id,
      email: user.email,
      username: user.name
    };
  }

  async findUserByEmail(email: string): Promise<{ id: number; email: string; username: string } | null> {
    const response = await fetch(`${this.baseUrl}/users/find-by-email/${encodeURIComponent(email)}`, {
      method: 'GET'
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json() as ErrorResponse;
      throw new Error(error.message || 'Failed to find user by email');
    }

    const user = await response.json() as UserResponse;
    return {
      id: user.id,
      email: user.email,
      username: user.name
    };
  }

  async deleteUser(user_id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/users/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id
      })
    });

    if (!response.ok) {
      const error = await response.json() as ErrorResponse;
      throw new Error(error.message || 'Failed to delete user');
    }
  }
}