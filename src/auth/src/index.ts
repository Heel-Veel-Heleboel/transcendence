import app from './app.js';
import { serverInfo } from './config/server-info.js';
const start = async () => {
  try {
    await app.listen({ port: serverInfo.PORT, host: serverInfo.HOST });
    console.log(`Auth service is running on port ${serverInfo.PORT}`);
  } catch (err) {
    console.error('Error starting Auth service:', err);
    process.exit(1);
  }
};

start();

const shutDown = async () => {
  console.log('Shutting down Auth service...');
  try {
    await app.close();
    console.log('Auth service shut down gracefully.');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown of Auth service:', err);
    process.exit(1);
  }
};

process.on('SIGINT', shutDown);
process.on('SIGTERM', shutDown);