//error messages for configuration issues
export const ConfigurationErrors = {
  envVariableNotSet: (variableName: string) => `Environment variable ${variableName} is not set`,
  ENV_VALIDATION_FAILED: 'Environment variable validation failed',
  ENV_MISSING: (variableName: string) => `Environment variable ${variableName} is missing`,
  INVALID_DB_NAME: 'DATABASE_URL must be "file::memory:" or "file:<name>.db" (e.g., "file:dev.db")'
};

