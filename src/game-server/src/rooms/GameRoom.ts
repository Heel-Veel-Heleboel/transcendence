import { Room, Client, CloseCode } from 'colyseus';
import { GameRoomState } from '#schema/GameRoomState.js';
import { createBall } from '#gameEngine/Create.js';
import { GameEngine } from '#gameEngine/GameEngine.js';
import { Vector3 } from '@babylonjs/core';

export class GameRoom extends Room {
  maxClients = 4;
  state = new GameRoomState();
  engine: GameEngine;
  id = 0;

  messages = {
    'set-position': (client: Client) => {
      const ball = this.state.balls.get(client.sessionId);
      ball.x = ball.physicsMesh.mesh.absolutePosition.x;
      ball.y = ball.physicsMesh.mesh.absolutePosition.y;
      ball.z = ball.physicsMesh.mesh.absolutePosition.z;
      const lv = ball.physicsMesh.aggregate.body.getLinearVelocity();
      ball.linearVelocityX = lv.x;
      ball.linearVelocityY = lv.y;
      ball.linearVelocityZ = lv.z;
      // console.log(client.sessionId, 'sent a message:', data);
    }
  };

  async onCreate(options: any) {
    this.engine = new GameEngine(this);
    await this.engine.initGame();
    /**
     * Called when a new room is created.
     */
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, 'joined!');
    const ball = createBall(this.engine.scene, new Vector3(0, 0, 0), 1);

    ball.lifespan = 1000;
    ball.id = this.id;
    ball.x = 0;
    ball.y = 0;
    ball.z = 0;
    ball.linearVelocityX = 0;
    ball.linearVelocityY = 0;
    ball.linearVelocityZ = 0;
    ball.physicsMesh.aggregate.body.applyForce(
      new Vector3(
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100
      ),
      ball.physicsMesh.mesh.absolutePosition
    );
    this.id++;
    console.log('setting ball in state: ');
    this.state.balls.set(client.sessionId, ball);
  }

  onLeave(client: Client, code: CloseCode) {
    /**
     * Called when a client leaves the room.
     */
    console.log(client.sessionId, 'left!', code);

    const ball = this.state.balls.get(client.sessionId);
    if (ball) {
      ball.dispose();
      const removed = this.state.balls.delete(client.sessionId);
      console.log(removed);
      console.log(this.state.balls);
    }
    client.leave();
  }

  onDispose() {
    /**
     * Called when the room is disposed.
     */
    console.log('room', this.roomId, 'disposing...');
  }
}
