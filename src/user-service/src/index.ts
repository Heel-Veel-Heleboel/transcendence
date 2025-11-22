import { app } from './app.js';


const start = async () => {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' });
    console.log('User service is running on http://localhost:3000.');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
