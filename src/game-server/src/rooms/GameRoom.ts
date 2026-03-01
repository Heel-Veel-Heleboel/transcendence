import { Room, Client, CloseCode } from 'colyseus';
import { GameRoomState } from '#schema/GameRoomState.js';
import { createBall } from '#gameEngine/Create.js';
import { GameEngine } from '#gameEngine/GameEngine.js';
import { Vector3 } from '@babylonjs/core';
import { Player } from './entities/Player.js';

interface GameRoomOptions {
  matchId: string;
  player1Id: number;
  player2Id: number;
  player1Username: string;
  player2Username: string;
  gameMode: string;
  tournamentId?: number | null;
  deadline?: string | null;  // ISO string (Date is not JSON-serializable over the wire)
  isGoldenGame?: boolean;
}

export class GameRoom extends Room {
  autoDispose = false; // Room persists until both players have joined and left
  maxClients = 2;
  state = new GameRoomState();
  engine: GameEngine;
  id = 0;

  // Match context — used when reporting the result back to matchmaking
  matchId: string;
  player1Id: number;
  player2Id: number;
  player1Username: string;
  player2Username: string;
  gameMode: string;
  tournamentId: number | null;
  deadline: Date | null;
  isGoldenGame: boolean;

  messages = {
    'set-position': (client: Client, data: any) => {
      const player = this.state.players.get(client.sessionId);
      player.move({ x: data.x, y: data.y });
    }
  };

  async onCreate(options: GameRoomOptions) {
    this.matchId = options.matchId;
    this.player1Id = options.player1Id;
    this.player2Id = options.player2Id;
    this.player1Username = options.player1Username;
    this.player2Username = options.player2Username;
    this.gameMode = options.gameMode;
    this.tournamentId = options.tournamentId ?? null;
    this.deadline = options.deadline ? new Date(options.deadline) : null;
    this.isGoldenGame = options.isGoldenGame ?? false;

    this.engine = new GameEngine(this);
    await this.engine.initGame();
  }

  onJoin(client: Client, _options: any) {
    console.log(client.sessionId, 'joined!');

    const hostConfig = {
      keys: {
        columns: 'qwaszx',
        rows: 'erdfcv',
        length: 6,
        precisionKeys: 'ArrowUp;ArrowDown;ArrowLeft;ArrowRight'
      },
      goalPosition: this.engine.arena.goal_1.mesh.absolutePosition,
      goalDimensions: this.engine.arena.goal_1.mesh
        .getBoundingInfo()
        .boundingBox.extendSizeWorld.scale(2),
      isHost: true
    };
    const guestConfig = {
      keys: {
        columns: 'qwaszx',
        rows: 'erdfcv',
        length: 6,
        precisionKeys: 'ArrowUp;ArrowDown;ArrowLeft;ArrowRight'
      },
      goalPosition: this.engine.arena.goal_2.mesh.absolutePosition,
      goalDimensions: this.engine.arena.goal_2.mesh
        .getBoundingInfo()
        .boundingBox.extendSizeWorld.scale(2),
      isHost: false
    };
    if (this.state.players.size === 0) {
      const player = new Player(hostConfig, this.engine.scene);
      this.state.players.set(client.sessionId, player);
    } else {
      const otherPlayer = [...this.state.players][0];

      if (otherPlayer[1].isHost) {
        const player = new Player(guestConfig, this.engine.scene);
        this.state.players.set(client.sessionId, player);
      } else {
        const player = new Player(hostConfig, this.engine.scene);
        this.state.players.set(client.sessionId, player);
      }
    }
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
      this.state.balls.delete(client.sessionId);
    }
    const player = this.state.players.get(client.sessionId);
    if (player) {
      player.dispose();
      this.state.players.delete(client.sessionId);
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
