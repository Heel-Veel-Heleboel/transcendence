import axios, { AxiosError } from 'axios';
import { UserManagementService } from '../types/user-management-service.js';

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
  private timeout: number;

  constructor(baseUrl: string, timeout: number = 5000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  async createUser(email: string, username: string): Promise<number> {
    try {
      const response = await axios.post<CreateUserResponse>(
        `${this.baseUrl}/users/create`,
        {
          user_email: email,
          user_name: username
        },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data.user_id;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as ErrorResponse;
        throw new Error(errorData.message || 'Failed to create user');
      }
      throw new Error('Failed to create user');
    }
  }

  async findByUserId(user_id: number): Promise<{ id: number; email: string; username: string } | null> {
    try {
      const response = await axios.get<UserResponse>(
        `${this.baseUrl}/users/find-by-id/${user_id}`,
        { timeout: this.timeout }
      );
      return {
        id: response.data.id,
        email: response.data.email,
        username: response.data.name
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          return null;
        }
        if (error.response) {
          const errorData = error.response.data as ErrorResponse;
          throw new Error(errorData.message || 'Failed to find user');
        }
      }
      throw new Error('Failed to find user');
    }
  }

  async findUserByEmail(email: string): Promise<{ id: number; email: string; username: string } | null> {
    try {
      const response = await axios.get<UserResponse>(
        `${this.baseUrl}/users/find-by-email/${encodeURIComponent(email)}`,
        { timeout: this.timeout }
      );
      return {
        id: response.data.id,
        email: response.data.email,
        username: response.data.name
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          return null;
        }
        if (error.response) {
          const errorData = error.response.data as ErrorResponse;
          throw new Error(errorData.message || 'Failed to find user by email');
        }
      }
      throw new Error('Failed to find user by email');
    }
  }

  async deleteUser(user_id: number): Promise<void> {
    try {
      await axios.delete(
        `${this.baseUrl}/users/delete`,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
            user_id
          }
        }
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as ErrorResponse;
        throw new Error(errorData.message || 'Failed to delete user');
      }
      throw new Error('Failed to delete user');
    }
  }
}