import { ServerConfigSchema, ServerConfig } from '../schemas/server-info.js';

function getServerInfo(): ServerConfig {
  const config = {
    PORT: process.env.PORT,
    HOST: process.env.HOST,
    USER_MANAGEMENT_URL: process.env.USER_MANAGEMENT_URL
  };

  const result = ServerConfigSchema.safeParse(config);

  if (!result.success) {
    console.error('Server configuration validation failed:');
    result.error.issues.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    throw new Error('Invalid server configuration');
  }

  return result.data;
}

export const serverInfo = getServerInfo();