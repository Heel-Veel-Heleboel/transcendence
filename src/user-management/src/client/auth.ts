interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  details?: Array<{ path: string; message: string }>;
}

export class AuthClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  async deleteAuthDataForUser(user_id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/auth/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id })
    });

    if (!response.ok) {
      const error = await response.json() as ErrorResponse;
      throw new Error(error.message || 'Failed to delete auth data for user');
    }
  }
}