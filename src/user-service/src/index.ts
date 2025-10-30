import fastify from 'fastify'; 


const app = fastify();

app.get('/', async () => {
  return { hello: 'world' };
});

const start = async () => {
  try {
    await app.listen({ port: 3000, host: ' 0.0.0.0' });
    console.log('User service is running on port 3000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};
start();