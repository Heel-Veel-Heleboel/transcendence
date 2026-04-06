export const AUTH_ERROR_MESSAGES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'Invalid credentials provided.',
  INVALID_TOKEN_FORMAT: 'Invalid refresh token format.',
  INVALID_TOKEN: 'Invalid refresh token.',
  TOKEN_EXPIRED: 'Refresh token has expired.',
  PASSWORD_SAME_AS_OLD: 'New password cannot be the same as the old password.',
  UNAUTHORIZED: 'Authenticated user context is required.',
  // Authorization errors
  TOKEN_OWNERSHIP_MISMATCH: 'User ID does not match token owner.',
  
  // Resource not found errors
  USER_NOT_FOUND_BY_EMAIL: (email: string) => `User with email: ${email} does not exist.`,
  USER_NOT_FOUND_BY_ID: (id: number) => `User with ID: ${id} does not exist.`,
  USER_CREDENTIAL_NOT_FOUND_BY_ID: (id: number) => `User credentials for user ID: ${id} do not exist.`,
  
  // Registration errors
  REGISTRATION_CLEANUP_FAILED: 'Failed to cleanup user after registration error:',

  // 2FA errors
  TWO_FACTOR_SETUP_FAILED: 'Failed to setup two-factor authentication.',
  TWO_FACTOR_REQUIRED: 'Two-factor authentication code is required.',
  TWO_FACTOR_INVALID_TOKEN: 'Invalid two-factor authentication code.',
  TWO_FACTOR_AUTH_NOT_FOUND_BY_USER_ID: (id: number) => `Two-factor authentication data for user ID: ${id} does not exist.`,
  TWO_FACTOR_AUTH_MAX_ATTEMPTS: 'Too many invalid two-factor authentication attempts.',
  TWO_FACTOR_AUTH_EXPIRED: 'Two-factor authentication setup has expired.'
} as const;


export const AUTH_PREFIX = '/auth';