export const AUTH_ERROR_MESSAGES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'Invalid credentials provided.',
  INVALID_TOKEN_FORMAT: 'Invalid refresh token format.',
  INVALID_TOKEN: 'Invalid refresh token.',
  TOKEN_EXPIRED: 'Refresh token has expired.',
  
  // Authorization errors
  TOKEN_OWNERSHIP_MISMATCH: 'User ID does not match token owner.',
  
  // Resource not found errors
  USER_NOT_FOUND_BY_EMAIL: (email: string) => `User with email: ${email} does not exist.`,
  USER_NOT_FOUND_BY_ID: (id: number) => `User with ID: ${id} does not exist.`,
  USER_CREDENTIAL_NOT_FOUND_BY_ID: (id: number) => `User credentials for user ID: ${id} do not exist.`,
  
  // Registration errors
  REGISTRATION_CLEANUP_FAILED: 'Failed to cleanup user after registration error:'
} as const;