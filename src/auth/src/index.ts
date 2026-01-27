import app from './app.js';

const start = async () => {
  try {
    await app.listen({ port: 3003, host: '0.0.0.0' });
    console.log('Auth service is running on port 3003');
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