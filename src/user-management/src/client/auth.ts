import axios from 'axios';

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  details?: Array<{ path: string; message: string }>;
}

export class AuthClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string, timeout: number) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }
  async deleteAuthDataForUser(user_id: number): Promise<void> {
    try {
      await axios.delete(`${this.baseUrl}/auth/delete-auth-data`, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          user_id
        }
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as ErrorResponse;
        throw new Error(
          `Error ${errorData.statusCode}: ${errorData.error} - ${errorData.message}`
        );
      } else {
        throw new Error(`Network or unexpected error: ${error}`);
      }
    }
  }
}