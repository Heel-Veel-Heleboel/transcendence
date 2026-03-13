//error messages for configuration issues
export const ConfigurationErrors = {
  envVariableNotSet: (variableName: string) => `Environment variable ${variableName} is not set`,
  ENV_VALIDATION_FAILED: 'Environment variable validation failed',
  ENV_MISSING: (variableName: string) => `Environment variable ${variableName} is missing`,
  INVALID_DB_NAME: 'DATABASE_URL must be "file::memory:" or "file:<name>.db" (e.g., "file:dev.db")',
  INVALID_IP_ADDRESS: 'IP must be a valid IPv4 address (e.g., "192.168.1.1")'
};

export const UserDomainErrorMessages = {
  EMAIL_ALREADY_EXISTS: 'User with this email already exists',
  NAME_ALREADY_EXISTS: 'User with this name already exists',
  USER_NOT_FOUND: 'User not found'
};

export const ProfileDomainErrorMessages = {
  PROFILE_NOT_FOUND: 'Profile not found',
  FAILED_TO_UPLOAD_PROFILE_AVATAR: 'Failed to update profile avatar',
  FAILED_TO_UPDATE_PROFILE_STATS: 'Failed to update profile stats'
};

export const FriendshipDomainErrorMessages = {
  FRIENDSHIP_ALREADY_EXISTS: 'Friendship already exists',
  FRIENDSHIP_NOT_FOUND: 'Friendship not found',
  USERS_BLOCKED: 'One of the users has blocked the other'
};

export const CommonErrorMessages = {
  DATABASE_ERROR: 'Database error occurred',
  INTERNAL_SERVER_ERROR: 'An unexpected error occurred',
  VALIDATION_ERROR: 'Validation error occurred'
};

export const ClientErrors = {
  CLIENT_ERROR: (clientName: string) => `An error occurred while communicating with ${clientName}`
};

