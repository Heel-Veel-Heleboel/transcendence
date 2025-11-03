// import fastify from 'fastify'; 


// const app = fastify();

// app.get('/', async () => {
//   return { hello: 'world' };
// });

// const start = async () => {
//   try {
//     await app.listen({ port: 3000, host: ' 0.0.0.0' });
//     console.log('User service is running on port 3000');
//   } catch (err) {
//     app.log.error(err);
//     process.exit(1);
//   }
// };
// start();


import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

async function main()  {
  // const user = await prisma.user.create({
  //   data: {
  //     username: 'Artem',
  //     email: 'amysiv9@gmail.com',
  //     password: 'password123'
  //   }
  // });
  const allUsers = await prisma.user.findMany();
  console.log(allUsers);
}


main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });