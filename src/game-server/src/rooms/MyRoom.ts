import { Room, Client, CloseCode } from 'colyseus';
import { MyRoomState, Ball } from './schema/MyRoomState.js';

export class MyRoom extends Room {
  maxClients = 4;
  id = 0;
  state = new MyRoomState();

  messages = {
    'set-position': (client: Client, data: any) => {
      const ball = this.state.balls.get(client.sessionId);
      ball.x = data._x;
      ball.y = data._y;
      ball.z = data._z;
      console.log(client.sessionId, 'sent a message:', data);
    }
  };

  onCreate(options: any) {
    /**
     * Called when a new room is created.
     */
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, 'joined!');
    const ball = new Ball();

    ball.id = this.id;
    ball.x = 0;
    ball.y = 0;
    ball.z = 0;
    ball.xForce = 0;
    ball.yForce = 0;
    ball.zForce = 10;
    this.id++;
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
