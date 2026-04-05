import app from './app.js';
import { env } from './config/env.js';
const start = async () => {
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`User management service is running on port ${env.PORT}`);
  } catch (err) {
    app.log.error({ err }, 'Error starting User management service');
    process.exit(1);
  }
};

start();

const shutDown = async () => {
  app.log.info('Shutting down User management service...');
  try {
    await app.close();
    app.log.info('User management service shut down gracefully.');
    process.exit(0);
  } catch (err) {
    app.log.error({ err }, 'Error during shutdown of User management service');
    process.exit(1);
  }
};

process.on('SIGINT', shutDown);
process.on('SIGTERM', shutDown);