import fastify from 'fastify'

const server = fastify()

server.get('/user', async (request, reply) => {
  return {message : "Hello from User Service"}
})

server.listen({ port: 3001 }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})




let  counter = 0;

counter = 'Hello world';