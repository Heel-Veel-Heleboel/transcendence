import app from './app.js';
import { serverInfo } from './config/server-info.js';
const start = async () => {
  try {
    await app.listen({ port: serverInfo.PORT, host: serverInfo.HOST });
    app.log.info(`Auth service is running on port ${serverInfo.PORT}`);
  } catch (err) {
    app.log.error({ err }, 'Error starting Auth service');
    process.exit(1);
  }
};

start();

const shutDown = async () => {
  app.log.info('Shutting down Auth service...');
  try {
    await app.close();
    app.log.info('Auth service shut down gracefully.');
    process.exit(0);
  } catch (err) {
    app.log.error({ err }, 'Error during shutdown of Auth service');
    process.exit(1);
  }
};

process.on('SIGINT', shutDown);
process.on('SIGTERM', shutDown);