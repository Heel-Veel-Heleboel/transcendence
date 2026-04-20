import { Room, Client, CloseCode } from 'colyseus';
import { GameRoomState } from '#schema/GameRoomState.js';
import { createHack, createPowerShot } from '#game-engine/create.js';
import { GameEngine } from '#game-engine/game-engine.js';
import { PhysicsEventType, Vector3 } from '@babylonjs/core';
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
  frameCount = 0;
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
  player1Ack: boolean = false;
  player2Ack: boolean = false;
  gameMode: string;
  tournamentId: number | null;
  deadline: Date | null;
  isGoldenGame: boolean;

  messages = {
    'set-position': (client: Client, data: any) => {
      const player = this.state.players.get(client.sessionId);
      player.move({ x: data.x, y: data.y });
    },
    'client-ack': (client: Client, _data: any) => {
      console.log(`room: ${this.roomId} - client-ack ${client.sessionId}`);
      const player = this.state.players.get(client.sessionId);
      if (player) {
        if (client.sessionId === this.player1SessionId) {
          this.player1Ack = true;
        }
        if (client.sessionId === this.player2SessionId) {
          this.player2Ack = true;
        }
      }
      if (this.player1Ack && this.player2Ack) {
        this.broadcastGameStart();
        this.addHack();
        renderLoop(this.engine);
      }
    },
    'client-error': (client: Client, data: any) => {
      console.log(`room: ${this.roomId} - client-error ${client.sessionId}`);
      if (
        !(
          client.sessionId === this.player1SessionId ||
          client.sessionId === this.player2SessionId
        )
      ) {
        return;
      }
      if (data.payload === 'init-fail') {
        this.sendCancelResult(closeCodes.STARTUP_FAIL);
      }
      if (data.payload === 'crash') {
        this.sendResult(closeCodes.CLIENT_GAME_CRASH);
      }
    },
    'powerup-1': (client: Client, _data: any) => {
      if (this.gameMode === 'powerup') {
        const player = this.state.players.get(client.sessionId);
        if (player && player.mana >= 25) {
          console.log(`room: ${this.roomId} - powerup-1 ${client.sessionId}`);
          player.powerup1();
        }
      }
    },
    'powerup-2': (client: Client, _data: any) => {
      if (this.gameMode === 'powerup') {
        const player = this.state.players.get(client.sessionId);
        if (player && player.mana >= 50) {
          console.log(`room: ${this.roomId} - powerup-2 ${client.sessionId}`);
          player.powerup2();
          this.clock.setTimeout(() => {
            player.powerup2Reset();
          }, 30 * 1000);
        }
      }
    },
    'powerup-3': (client: Client, _data: any) => {
      if (this.gameMode === 'powerup') {
        const player = this.state.players.get(client.sessionId);
        if (player && player.mana >= 75) {
          console.log(`room: ${this.roomId} - powerup-3 ${client.sessionId}`);
          player.powerup3();
          this.clock.setTimeout(() => {
            player.powerup3Reset();
          }, 30 * 1000);
        }
      }
    },
    'powerup-4': (client: Client, _data: any) => {
      if (this.gameMode === 'powerup') {
        const player = this.state.players.get(client.sessionId);
        if (player && player.mana >= 100) {
          console.log(`room: ${this.roomId} - powerup-4 ${client.sessionId}`);
          player.powerup4();
        }
      }
    },
    powershot: (client: Client, data: any) => {
      if (this.gameMode === 'powerup') {
        console.log(`room: ${this.roomId} - powershot ${client.sessionId}`);
        const player = this.state.players.get(client.sessionId);
        if (player && player.powerShots) {
          player.powerup4Shot();
          const o = data.origin;
          const d = data.direction;
          const shot = createPowerShot(
            this.engine.scene,
            new Vector3(o._x, o._y, o._z),
            new Vector3(d._x, d._y, d._z),
            1
          );
          shot.id = this.id;
          this.state.hacks.set(String(this.id), shot);
          this.id++;
        }
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
      if (
        this.state.players.size != 2 ||
        !this.player1Ack ||
        !this.player2Ack
      ) {
        this.sendCancelResult(closeCodes.FAILED_TO_JOIN);
      }
    }, 10 * 1000);
  }

  update(_deltaTime: number) {
    if (this.gameMode === 'powerup') {
      this.state.players.forEach((key, _value) => {
        key.updateMana(0.01);
        if (key.isDead) {
          this.gameFinished = true;
        }
      });
    }

    if (this.gameFinished) {
      this.engine.engine.stopRenderLoop();
      this.sendResult();
    }

    this.state.hacks.forEach((key, value) => {
      if (key.isDead()) {
        this.state.hacks.delete(value);
      }
    });

    if (!(this.frameCount % 200)) {
      this.addHack();
    }

    this.frameCount++;
  }

  addHack() {
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
    this.state.hacks.set(String(this.id), hack);
  }

  async sendResult(closeCode?: number) {
    if (this.isSendingResult) {
      return;
    }
    let winner;
    try {
      this.isSendingResult = true;
      console.log(
        `room: ${this.roomId} - sending result of ${this.matchId} to matchmaking service`
      );
      const player1 = this.state.players.get(this.player1SessionId);
      const player2 = this.state.players.get(this.player2SessionId);

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
        if (this.player1Client) {
          this.player1Client.leave(closeCode);
        }
        if (this.player2Client) {
          this.player2Client.leave(closeCode);
        }
      }
    } catch (e: any) {
      console.error(e);
      if (this.player1Client) {
        this.player1Client.leave(closeCodes.FAILED_TO_FINISH);
      }
      if (this.player2Client) {
        this.player2Client.leave(closeCodes.FAILED_TO_FINISH);
      }
    } finally {
      const winnerName =
        winner === this.player1Id
          ? this.player1Username
          : winner === this.player2Id
            ? this.player2Username
            : '?';
      this.gameFinish(winnerName);
    }
  }

  async sendDisconnectResult() {
    let winner;
    try {
      this.isSendingResult = true;
      console.log(
        `room: ${this.roomId} - sending disconnect result of ${this.matchId} to matchmaking service`
      );
      const player1 = this.state.players.get(this.player1SessionId);
      const player2 = this.state.players.get(this.player2SessionId);

      if (player1 && player2) {
        winner = player1.connected
          ? this.player1Id
          : player2.connected
            ? this.player2Id
            : 0;
      } else if (!player1 && player2) {
        winner = this.player2Id;
      } else if (player1 && !player2) {
        winner = this.player1Id;
      }

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
      if (this.player1Client) {
        this.player1Client.leave(closeCodes.FAILED_TO_FINISH);
      }
      if (this.player2Client) {
        this.player2Client.leave(closeCodes.FAILED_TO_FINISH);
      }
    } finally {
      const winnerName =
        winner === this.player1Id
          ? this.player1Username
          : winner === this.player2Id
            ? this.player2Username
            : '?';
      this.gameFinish(winnerName);
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
        if (typeof this.player1Client !== 'undefined') {
          this.player1Client.leave(code);
        }
        if (typeof this.player2Client !== 'undefined') {
          this.player2Client.leave(code);
        }
      }
    } catch (e: any) {
      console.error(e);
      if (typeof this.player1Client !== 'undefined') {
        this.player1Client.leave(closeCodes.FAILED_TO_FINISH);
      }
      if (typeof this.player2Client !== 'undefined') {
        this.player2Client.leave(closeCodes.FAILED_TO_FINISH);
      }
    } finally {
      this.disconnect();
    }
  }

  onJoin(client: Client, _options: any) {
    console.log(`room: ${this.roomId} - client: ${client.sessionId} joined!`);

    if (_options.userId === this.player1Id) {
      console.log(
        `room: ${this.roomId} - initializing player1 with id:${this.player1Id}`
      );
      const player = new Player(
        getHostConfig(this.engine.arena.goal_1),
        this.player1Username,
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
        this.player2Username,
        this.engine.scene
      );
      this.player2Client = client;
      this.player2SessionId = client.sessionId;
      this.state.players.set(client.sessionId, player);
    }
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
    if (code === closeCodes.SERVER_SHUTDOWN) {
      this.sendCancelResult();
      return;
    }
    this.engine.engine.stopRenderLoop();
    this.broadcastGameInterrupted();
  }

  onReconnect(client: Client<any>): void | Promise<any> {
    console.log(
      `room: ${this.roomId} - client ${client.sessionId} reconnected!`
    );

    const player = this.state.players.get(client.sessionId);
    if (player) {
      player.connected = true;
      this.broadcastGameRestarted();
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
    case closeCodes.SERVER_SHUTDOWN:
      this.sendCancelResult();
      break;
    default:
      break;
    }

    const player = this.state.players.get(client.sessionId);
    if (player) {
      player.dispose();
      this.state.players.delete(client.sessionId);
    }
    client.leave();
  }

  onDispose() {
    console.log(`room: ${this.roomId} - disposing of room`);
    this.engine.scene.dispose();
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

  onBeforeShutdown() {
    if (this.player1Client) {
      this.player1Client.leave(closeCodes.SERVER_ERROR);
    }
    if (this.player2Client) {
      this.player2Client.leave(closeCodes.SERVER_ERROR);
    }
    this.sendCancelResult();

    this.clock.setTimeout(() => this.disconnect(), 5 * 1000);
  }

  initializeObservers() {
    const player1 = this.state.players.get(this.player1SessionId);
    const player2 = this.state.players.get(this.player2SessionId);

    console.log(`room: ${this.roomId} - initializing observers`);
    const observable1 =
      this.engine.arena.goal_1.aggregate.body.getCollisionObservable();
    observable1.add(collisionEvent => {
      if (collisionEvent.type !== PhysicsEventType.COLLISION_STARTED) {
        return;
      }
      if (this.gameMode === 'classic') {
        player2.updateScore(1);
        if (player2.score >= 11) {
          this.gameFinished = true;
        }
        console.log(`room: ${this.roomId} - goal 1`);
      } else if (this.gameMode === 'powerup' && !player1.isImmun) {
        player1.updateLife(-20);
        console.log(`room: ${this.roomId} - hit 1`);
      }
    });
    const observable2 =
      this.engine.arena.goal_2.aggregate.body.getCollisionObservable();
    observable2.add(collisionEvent => {
      if (collisionEvent.type !== PhysicsEventType.COLLISION_STARTED) {
        return;
      }

      if (this.gameMode === 'classic') {
        player1.updateScore(1);
        if (player1.score >= 11) {
          this.gameFinished = true;
        }
        console.log(`room: ${this.roomId} - goal 2`);
      } else if (this.gameMode === 'powerup' && !player2.isImmun) {
        player2.updateLife(-20);
        console.log(`room: ${this.roomId} - hit 2`);
      }
    });
  }

  gameFinish(winner: string) {
    this.broadcastGameFinish(winner);

    this.clock.setTimeout(() => {
      if (this.player1Client) {
        this.player1Client.leave(closeCodes.CONSENTED);
      }
      if (this.player2Client) {
        this.player2Client.leave(closeCodes.CONSENTED);
      }
      this.disconnect();
    }, 10 * 1000);
  }

  broadcastGameStart() {
    console.log(`room: ${this.roomId} - broadcasting game-start`);
    this.broadcast('game-start', '');
  }

  broadcastGameInterrupted() {
    console.log(`room: ${this.roomId} - broadcasting game-interrupted`);
    this.broadcast('game-interrupted', '');
  }

  broadcastGameRestarted() {
    console.log(`room: ${this.roomId} - broadcasting game-restart`);
    this.broadcast('game-restart', '');
  }

  broadcastGameFinish(winner: string) {
    console.log(`room: ${this.roomId} - broadcasting game-finish`);
    this.broadcast('game-finished', winner);
  }

  broadcastShutdown() {
    console.log(`room: ${this.roomId} - broadcasting server-shutdown`);
    this.broadcast('server-shutdown', '');
  }
}
