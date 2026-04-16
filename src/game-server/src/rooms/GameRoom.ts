import { Room, Client, CloseCode } from 'colyseus';
import { setTimeout } from 'timers/promises';
import { GameRoomState } from '#schema/GameRoomState.js';
import { createHack } from '#game-engine/create.js';
import { GameEngine } from '#game-engine/game-engine.js';
import { Vector3 } from '@babylonjs/core';
import { Player } from './entities/player.js';
import { renderLoop } from '#game-engine/render.js';
import { getGuestConfig, getHostConfig } from './entities/config.js';
import { closeCodes } from '#types/close-codes.js';

interface GameRoomOptions {
  matchId: string;
  player1Id: number;
  player2Id: number;
  player1Username: string;
  player2Username: string;
  gameMode: string;
  tournamentId?: number | null;
  deadline?: string | null; // ISO string (Date is not JSON-serializable over the wire)
  isGoldenGame?: boolean;
}

export class GameRoom extends Room {
  autoDispose = false; // Room persists until both players have joined and left
  maxClients = 2;
  state = new GameRoomState();
  engine: GameEngine;
  id = 0;
  gameFinished = false;
  hasCrashed = false;
  isSendingResult = false;

  // Match context — used when reporting the result back to matchmaking
  matchId: string;
  player1Id: number;
  player2Id: number;
  player1Username: string;
  player2Username: string;
  player1SessionId: string;
  player2SessionId: string;
  player1Client: Client;
  player2Client: Client;
  gameMode: string;
  tournamentId: number | null;
  deadline: Date | null;
  isGoldenGame: boolean;

  messages = {
    'set-position': (client: Client, data: any) => {
      const player = this.state.players.get(client.sessionId);
      player.move({ x: data.x, y: data.y });
    },
    'client-error': (client: Client, data: any) => {
      if (
        !(
          client.sessionId === this.player1SessionId ||
          client.sessionId === this.player2SessionId
        )
      ) {
        return;
      }
      if (data.payload === 'crash') {
        this.sendResult(closeCodes.CLIENT_GAME_CRASH);
      }
    }
  };

  async onCreate(options: GameRoomOptions) {
    console.log(`room: ${this.roomId} - creation of room`);
    this.matchId = options.matchId;
    this.player1Id = options.player1Id;
    this.player2Id = options.player2Id;
    this.player1Username = options.player1Username;
    this.player2Username = options.player2Username;
    this.gameMode = options.gameMode;
    this.tournamentId = options.tournamentId ?? null;
    this.deadline = options.deadline ? new Date(options.deadline) : null;
    this.isGoldenGame = options.isGoldenGame ?? false;

    console.log(`room: ${this.roomId} - creating game engine`);
    this.engine = new GameEngine(this);
    console.log(`room: ${this.roomId} - initializing game`);
    await this.engine.initGame();
    this.setSimulationInterval(deltaTime => this.update(deltaTime));
    this.clock.setTimeout(() => {
      if (this.state.players.size != 2) {
        this.sendCancelResult(closeCodes.FAILED_TO_JOIN);
      }
    }, 10000);
  }

  update(_deltaTime: number) {
    if (this.gameFinished) {
      this.sendResult();
    }
    if (this.gameMode === 'powerup') {
      this.state.players.forEach((key, _value) => {
        key.updateMana(0.01);
      });
    }
  }

  async sendResult(closeCode?: number) {
    if (this.isSendingResult) {
      return;
    }
    try {
      this.isSendingResult = true;
      console.log(
        `room: ${this.roomId} - sending result of ${this.matchId} to matchmaking service`
      );
      const player1 = this.state.players.get(this.player1SessionId);
      const player2 = this.state.players.get(this.player2SessionId);

      let winner;
      let score1;
      let score2;

      if (this.gameMode === 'classic') {
        winner =
          player1.score > player2.score
            ? this.player1Id
            : player2.score > player1.score
              ? this.player2Id
              : player1.score === player2.score
                ? this.player1Id
                : this.player2Id;
        score1 = player1.score;
        score2 = player2.score;
      } else if (this.gameMode === 'powerup') {
        winner = player1.isDead
          ? this.player2Id
          : player2.isDead
            ? this.player1Id
            : player1.lifespan > player2.lifespan
              ? this.player1Id
              : player1.lifespan === player2.lifespan
                ? this.player1Id
                : this.player2Id;
        score1 = winner === this.player1Id ? 3 : 0;
        score2 = winner === this.player2Id ? 3 : 0;
      }

      await fetch(
        `http://matchmaking:3005/matchmaking/match/${this.matchId}/result`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            winnerId: winner,
            player1Score: score1,
            player2Score: score2,
            isFinished: true
          })
        }
      );
      if (closeCode) {
        this.player1Client.leave(closeCode);
        this.player2Client.leave(closeCode);
      }
    } catch (e: any) {
      console.error(e);
      this.player1Client.leave(closeCodes.FAILED_TO_FINISH);
      this.player2Client.leave(closeCodes.FAILED_TO_FINISH);
    } finally {
      this.disconnect();
    }
  }

  async sendDisconnectResult() {
    try {
      this.isSendingResult = true;
      console.log(
        `room: ${this.roomId} - sending disconnect result of ${this.matchId} to matchmaking service`
      );
      const player1 = this.state.players.get(this.player1SessionId);
      const player2 = this.state.players.get(this.player2SessionId);

      const winner = player1.connected
        ? this.player1Id
        : player2.connected
          ? this.player2Id
          : 0;

      if (!winner) {
        this.isSendingResult = false;
        this.sendResult();
        return;
      }

      await fetch(
        `http://matchmaking:3005/matchmaking/match/${this.matchId}/result`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            winnerId: winner,
            player1Score: winner === this.player1Id ? 5 : 0,
            player2Score: winner === this.player2Id ? 5 : 0,
            isFinished: false
          })
        }
      );
    } catch (e: any) {
      console.error(e);
      this.player1Client.leave(closeCodes.FAILED_TO_FINISH);
      this.player2Client.leave(closeCodes.FAILED_TO_FINISH);
    } finally {
      this.disconnect();
    }
  }

  async sendCancelResult(code?: number) {
    try {
      this.isSendingResult = true;
      console.log(
        `room: ${this.roomId} - sending cancel result of ${this.matchId} to matchmaking service`
      );
      await fetch(
        `http://matchmaking:3005/matchmaking/match/${this.matchId}/result`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isFinished: false
          })
        }
      );
      if (code) {
        this.player1Client.leave(code);
        this.player2Client.leave(code);
      }
    } catch (e: any) {
      console.error(e);
      this.player1Client.leave(closeCodes.FAILED_TO_FINISH);
      this.player2Client.leave(closeCodes.FAILED_TO_FINISH);
    } finally {
      this.disconnect();
    }
  }

  onJoin(client: Client, _options: any) {
    console.log(`room: ${this.roomId} - client: ${client.sessionId} joined!`);
    setTimeout(2000); // INFO: wait to insure proper intialization

    if (_options.userId === this.player1Id) {
      console.log(
        `room: ${this.roomId} - initializing player1 with id:${this.player1Id}`
      );
      const player = new Player(
        getHostConfig(this.engine.arena.goal_1),
        this.engine.scene
      );
      this.player1SessionId = client.sessionId;
      this.player1Client = client;
      this.state.players.set(client.sessionId, player);
    } else if (_options.userId === this.player2Id) {
      console.log(
        `room: ${this.roomId} - initializing player2 with id:${this.player2Id}`
      );
      const player = new Player(
        getGuestConfig(this.engine.arena.goal_2),
        this.engine.scene
      );
      this.player2Client = client;
      this.player2SessionId = client.sessionId;
      this.state.players.set(client.sessionId, player);
    }
    const hack = createHack(this.engine.scene, new Vector3(0, 0, 0), 1);

    hack.lifespan = 1000;
    hack.id = this.id;
    hack.x = 0;
    hack.y = 0;
    hack.z = 0;
    hack.linearVelocityX = 0;
    hack.linearVelocityY = 0;
    hack.linearVelocityZ = 0;
    hack.physicsMesh.aggregate.body.applyForce(
      new Vector3(
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100
      ),
      hack.physicsMesh.mesh.absolutePosition
    );
    this.id++;
    this.state.hacks.set(client.sessionId, hack);
    if (this.state.players.size === 2) {
      this.initializeObservers();
    }
  }

  onDrop(client: Client<any>, code?: number): void | Promise<any> {
    console.log(
      `room: ${this.roomId} - client ${client.sessionId} dropped (code: ${code})`
    );
    this.allowReconnection(client, 5);

    const player = this.state.players.get(client.sessionId);
    if (player) {
      player.connected = false;
    }
    this.engine.engine.stopRenderLoop();
  }

  onReconnect(client: Client<any>): void | Promise<any> {
    console.log(
      `room: ${this.roomId} - client ${client.sessionId} reconnected!`
    );

    const player = this.state.players.get(client.sessionId);
    if (player) {
      player.connected = true;
      renderLoop(this.engine);
    }
  }

  onLeave(client: Client, code: CloseCode) {
    console.log(
      `room: ${this.roomId} - client ${client.sessionId} left (code: ${code})`
    );

    switch (code) {
      case closeCodes.FAILED_TO_RECONNECT:
        this.sendDisconnectResult();
        break;
      case closeCodes.GOING_AWAY:
        this.sendDisconnectResult();
        break;
      default:
        break;
    }

    const hack = this.state.hacks.get(client.sessionId);
    client.leave();
    if (hack) {
      hack.dispose();
      this.state.hacks.delete(client.sessionId);
    }
    const player = this.state.players.get(client.sessionId);
    if (player) {
      player.dispose();
      this.state.players.delete(client.sessionId);
    }
    client.leave();
  }

  onDispose() {
    this.engine.scene.dispose();
    console.log(`room: ${this.roomId} - disposing of room`);
  }

  onUncaughtException(err: Error, methodName: string) {
    console.error(
      `room: ${this.roomId} - an error ocurred in`,
      methodName,
      ':',
      err
    );
    this.sendCancelResult(closeCodes.SERVER_ERROR);
  }

  initializeObservers() {
    const player1 = this.state.players.get(this.player1SessionId);
    const player2 = this.state.players.get(this.player2SessionId);

    console.log(`room: ${this.roomId} - initializing observers`);
    const observable1 =
      this.engine.arena.goal_1.aggregate.body.getCollisionObservable();
    observable1.add(_collisionEvent => {
      if (this.gameMode === 'classic') {
        player2.score += 1;
      } else if (this.gameMode === 'powerup') {
        player1.lifespan -= 20;
      }
      console.log(`room: ${this.roomId} - goal 1`);
    });
    const observable2 =
      this.engine.arena.goal_2.aggregate.body.getCollisionObservable();
    observable2.add(_collisionEvent => {
      if (this.gameMode === 'classic') {
        player1.score += 1;
      } else if (this.gameMode === 'powerup') {
        player2.lifespan -= 20;
      }
      console.log(`room: ${this.roomId} - goal 2`);
    });
  }
}
