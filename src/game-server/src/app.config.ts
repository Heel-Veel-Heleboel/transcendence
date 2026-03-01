import {
  defineServer,
  defineRoom,
  monitor,
  playground,
  createRouter,
  createEndpoint,
  matchMaker
} from 'colyseus';
import basicAuth from 'express-basic-auth';
import express from 'express';

/**
 * Import your Room files
 */
import { GameRoom } from '#rooms/GameRoom.js';

const server = defineServer({
  /**
   * Define your room handlers:
   */
  rooms: {
    game_room: defineRoom(GameRoom)
  },

  /**
   * Experimental: Define API routes. Built-in integration with the "playground" and SDK.
   *
   * Usage from SDK:
   *   client.http.get("/api/hello").then((response) => {})
   *
   */
  routes: createRouter({
    api_hello: createEndpoint('/api/hello', { method: 'GET' }, async _ctx => {
      return { message: 'Hello World' };
    })
  }),

  /**
   * Bind your custom express routes here:
   * Read more: https://expressjs.com/en/starter/basic-routing.html
   */
  express: app => {
    app.use(express.json());

    /**
     * Called by matchmaking service when two players are paired.
     * Creates a Colyseus room with the match context so the game server can
     * report results back to matchmaking when the game ends.
     */
    app.post('/api/rooms/create', async (req, res) => {
      try {
        const { matchId, player1Id, player2Id, player1Username, player2Username, gameMode, tournamentId, deadline, isGoldenGame } = req.body;

        if (!matchId || !player1Id || !player2Id || !player1Username || !player2Username) {
          res.status(400).json({ error: 'Missing required fields: matchId, player1Id, player2Id, player1Username, player2Username' });
          return;
        }

        const room = await matchMaker.createRoom('game_room', {
          matchId,
          player1Id,
          player2Id,
          player1Username,
          player2Username,
          gameMode: gameMode ?? 'classic',
          tournamentId: tournamentId ?? null,
          deadline: deadline ?? null,
          isGoldenGame: isGoldenGame ?? false
        });

        res.json({ roomId: room.roomId });
      } catch (err) {
        console.error('Failed to create game room:', err);
        res.status(500).json({ error: 'Failed to create game room' });
      }
    });

    /**
     * Use @colyseus/monitor
     * It is recommended to protect this route with a password
     * Read more: https://docs.colyseus.io/tools/monitoring/#restrict-access-to-the-panel-using-a-password
     */
    app.use('/monitor', basicAuthMiddleware, monitor());

    app.use(express.static('public'));
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
