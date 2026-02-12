import { Room, Client, CloseCode } from 'colyseus';
import { GameRoomState } from '#schema/GameRoomState.js';
import { createBall } from '#gameEngine/Create.js';
import { GameEngine } from '#gameEngine/GameEngine.js';
import { Vector3 } from '@babylonjs/core';

export class GameRoom extends Room {
  maxClients = 4;
  state = new GameRoomState();
  engine: GameEngine;

  messages = {
    'set-position': (client: Client, data: any) => {
      const ball = this.state.balls.get(client.sessionId);
      ball.x = data._x;
      ball.y = data._y;
      ball.z = data._z;
      console.log(ball);
      // console.log(client.sessionId, 'sent a message:', data);
    }
  };

  async onCreate(options: any) {
    this.engine = new GameEngine();
    await this.engine.initGame();
    /**
     * Called when a new room is created.
     */
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, 'joined!');
    console.log(this.engine);
    const ball = createBall(this.engine.scene, new Vector3(0, 0, 0), 1);

    ball.lifespan = 1000;
    ball.x = 0;
    ball.y = 0;
    ball.z = 0;
    ball.physicsMesh.aggregate.body.applyForce(
      new Vector3(
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100
      ),
      ball.physicsMesh.mesh.absolutePosition
    );
    console.log('setting ball in state: ', ball);
    this.state.balls.set(client.sessionId, ball);
  }

  onLeave(client: Client, code: CloseCode) {
    /**
     * Called when a client leaves the room.
     */
    console.log(client.sessionId, 'left!', code);
    this.state.balls.delete(client.sessionId);
  }

  onDispose() {
    /**
     * Called when the room is disposed.
     */
    console.log('room', this.roomId, 'disposing...');
  }
}
