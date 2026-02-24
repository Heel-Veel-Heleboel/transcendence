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

export const CommonErrorMessages = {
  DATABASE_ERROR: 'Database error occurred',
  INTERNAL_SERVER_ERROR: 'An unexpected error occurred'
};

