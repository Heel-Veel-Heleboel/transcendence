import {
  defineServer,
  defineRoom,
  monitor,
  playground,
  createRouter,
  createEndpoint
} from 'colyseus';
import basicAuth from 'express-basic-auth';

/**
 * Import your Room files
 */
import { MyRoom } from './rooms/MyRoom.js';

const server = defineServer({
  /**
   * Define your room handlers:
   */
  rooms: {
    my_room: defineRoom(MyRoom)
  },

  /**
   * Experimental: Define API routes. Built-in integration with the "playground" and SDK.
   *
   * Usage from SDK:
   *   client.http.get("/api/hello").then((response) => {})
   *
   */
  routes: createRouter({
    api_hello: createEndpoint('/api/hello', { method: 'GET' }, async ctx => {
      return { message: 'Hello World' };
    })
  }),

  /**
   * Bind your custom express routes here:
   * Read more: https://expressjs.com/en/starter/basic-routing.html
   */
  express: app => {
    app.get('/hi', (req, res) => {
      res.send("It's time to kick ass and chew bubblegum!");
    });

    /**
     * Use @colyseus/monitor
     * It is recommended to protect this route with a password
     * Read more: https://docs.colyseus.io/tools/monitoring/#restrict-access-to-the-panel-using-a-password
     */
    app.use('/monitor', basicAuthMiddleware, monitor());

    /**
     * Use @colyseus/playground
     * (It is not recommended to expose this route in a production environment)
     */
    if (process.env.NODE_ENV !== 'production') {
      app.use('/', playground());
    }
  }
});

const basicAuthMiddleware = basicAuth({
  // list of users and passwords
  users: {
    admin: 'admin'
  },
  // sends WWW-Authenticate header, which will prompt the user to fill
  // credentials in
  challenge: true
});

export default server;

