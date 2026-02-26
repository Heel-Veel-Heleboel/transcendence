import app from './app.js';
import { env } from './config/env.js';
const start = async () => {
  try {
    await app.listen({ port: env.PORT, host: env.IP });
    console.log(`User management service is running on port ${env.PORT}`);
  } catch (err) {
    console.error('Error starting User management service:', err);
    process.exit(1);
  }
};

start();


const shutDown = async () => {
  console.log('Shutting down User management service...');
  try {
    await app.close();
    console.log('User management service shut down gracefully.');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown of User management service:', err);
    process.exit(1);
  }
};

process.on('SIGINT', shutDown);
process.on('SIGTERM', shutDown);