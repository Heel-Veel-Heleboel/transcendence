import { prisma } from './db/prisma-client.js';


prisma.$connect()
  .then(() => {
    console.log('Connected to the database successfully.');
  })
  .catch((error) => {
    console.error('Error connecting to the database:', error);
    process.exit(1); // Exit with an error code
  });

