import app from './app.js';

const start = async () => {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Auth service is running on port 3000');
  } catch (err) {
    console.error('Error starting Auth service:', err);
    process.exit(1);
  }
};

start();