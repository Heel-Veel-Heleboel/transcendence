//error messages for configuration issues
export const ConfigurationErrors = {
  envVariableNotSet: (variableName: string) => `Environment variable ${variableName} is not set`,
  ENV_VALIDATION_FAILED: 'Environment variable validation failed',
  INVALID_DB_NAME: 'Invalid database name. DATABASE_URL must be "file::memory:" or start with "file:" and end with ".db"'
};

