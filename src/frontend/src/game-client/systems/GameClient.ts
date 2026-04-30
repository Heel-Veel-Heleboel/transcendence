import {
  AbstractEngine,
  Scene,
  GizmoManager,
  Camera,
  Light,
  Sound,
  Color3,
  Ray,
  Vector3,
  MeshBuilder,
  LinesMesh,
  PointerEventTypes,
  Color4,
  CreateGroundFromHeightMap,
  CreateSphere,
  VertexBuffer,
  VertexData,
  Mesh,
  GlowLayer,
  StandardMaterial,
  InstancedMesh
} from '@babylonjs/core';
import {
  debugLayerListener,
  engineResizeListener
} from '../utils/EventListeners.ts';
import { prepareImportGLTF } from '../utils/Loaders';
import {
  createBgMusic,
  createHack,
  createGoalCamera,
  createLight,
  createVector3,
  createPowerCamera,
  createGoalCameraPositions,
  createObstacle,
  createFreeCamera
} from '../utils/Create';
import '@babylonjs/loaders/glTF';
import { Hack } from '../components/Hack';
import { KeyManager } from './KeyManager';
import { Hud } from '../components/Hud';
import { Arena } from '../components/Arena';
import { Callbacks, Room } from '@colyseus/sdk';
import { Protagonist } from '../components/Protagonist';
import { Antagonist } from '../components/Antagonist';
import gameConfig from '../utils/GameConfig.ts';
import { Dispatch, SetStateAction } from 'react';
import { LoadingScreen } from '../utils/LoadingScreen.ts';
import { ReconnectionScreen } from '../utils/ReconnectionScreen.ts';
import { WinnerScreen } from '../utils/WinnerScreen.ts';
import { IBounces, INetworkNodes } from '../types/Types.ts';
import { GridMaterial } from '@babylonjs/materials';
import p5 from 'p5';
import { NetworkPacket } from '../components/NetworkNode.ts';
import { Obstacle } from '../components/Obstacle.ts';
import * as INSPECTOR from '@babylonjs/inspector';

/* v8 ignore start */
export class GameClient {
  private _scene!: Scene;
  private _defaultScene!: Scene;
  private _engine!: AbstractEngine;
  private _gameMode!: string;
  private _matchId!: string;
  private _setError!: Dispatch<SetStateAction<Error | null>>;

  private _frameCount!: number;
  private _arena!: Arena;
  private _protagonist!: Protagonist;
  private _antagonist!: Antagonist;
  private _hud!: Hud;
  private _keyManager!: KeyManager;
  private _hacks!: Map<string, Hack>;
  private obstacles!: Map<string, Obstacle>;
  private _powerUpLines!: LinesMesh | null;
  private _room!: Room;
  private _networkNodes: INetworkNodes[];
  private _networkPackets: NetworkPacket[];
  private _networkRouters: InstancedMesh[];
  private _nodeProto!: Mesh;
  private _packetProto!: Mesh;
  private _obstacleMaterials!: StandardMaterial[];

  private _initialized: boolean = false;
  private _loadingScreen!: LoadingScreen;
  private _reconnectionScreen!: ReconnectionScreen;
  private _winnerScreen!: WinnerScreen;

  //@ts-ignore
  private _goalCamera!: Camera;
  private freeCamera!: Camera;
  private _goalCameraPositions!: Vector3[];
  private _powerCamera!: Camera;
  //@ts-ignore
  private _light!: Light;
  //@ts-ignore
  private _backgroundMusic!: Sound;

  constructor(
    defaultScene: Scene,
    gameMode: string,
    matchId: string,
    setError: Dispatch<SetStateAction<Error | null>>
  ) {
    this.defaultScene = defaultScene;
    this.engine = defaultScene.getEngine();
    this.gameMode = gameMode;
    this.matchId = matchId;
    this.setError = setError;
    this.loadingScreen = new LoadingScreen();
    this.reconnectionScreen = new ReconnectionScreen();
    this.winnerScreen = new WinnerScreen();
    this._networkNodes = [];
    this._networkPackets = [];
    this._networkRouters = [];

    // NOTE: Wraps class in Proxy to catch errors in every method
    return new Proxy(this, {
      get(target: any, prop: any) {
        const origMethod = target[prop];
        if (typeof origMethod == 'function') {
          return function (...args: any) {
            try {
              return origMethod.apply(target, args);
            } catch (e: any) {
              setError(e);
            }
          };
        }
      }
    });
  }

  async initGame() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    this.frameCount = 0;
    prepareImportGLTF(this.defaultScene);
    this.scene = await this.initScene(this.defaultScene);
    this.initBackground();
    this.displayLoadingScreen();

    debugLayerListener(this.scene);
    engineResizeListener(this.engine);
  }

  private async initScene(scene: Scene) {
    scene.ambientColor = new Color3(1, 1, 1);
    this.hud = new Hud(this.gameMode, scene);
    await this.hud.init();

    if (process.env.NODE_ENV !== 'production') {
      new GizmoManager(scene);
    }
    this.backgroundMusic = createBgMusic(scene);
    this.light = createLight(scene);
    this.arena = new Arena();
    await this.arena.initMesh(scene);

    this.hacks = new Map<string, Hack>();
    this.obstacles = new Map<string, Obstacle>();
    this._obstacleMaterials = [];

    scene.onBeforeRenderObservable.add(this.draw(this));

    scene.onPointerObservable.add(pointerInfo => {
      switch (pointerInfo.type) {
        case PointerEventTypes.POINTERDOUBLETAP:
          if (this.gameMode === 'powerup' && this.prota.powerShots) {
            const forwardRay = this.powerCamera.getForwardRay();
            this.room.send('powershot', {
              origin: forwardRay.origin,
              direction: forwardRay.direction.scale(50)
            });
          }

          break;
        default:
          break;
      }
    });
    scene.clearColor = new Color4(0, 0, 0, 1);
    this.initObstacleMaterials();
    this.engine.getRenderingCanvas()?.focus();
    INSPECTOR.Inspector.Show(this.scene, {});
    return scene;
  }

  initObstacleMaterials() {
    const material0 = new StandardMaterial('obstacle-material-0');
    const material1 = new StandardMaterial('obstacle-material-1');
    const material2 = new StandardMaterial('obstacle-material-2');
    const material3 = new StandardMaterial('obstacle-material-3');
    material1.emissiveColor = new Color3(
      0.6549019607843137,
      0.16470588235294117,
      0.7333333333333333
    );
    material1.wireframe = true;
    material2.emissiveColor = new Color3(
      0.39215686274509803,
      0.5607843137254902,
      0.12941176470588237
    );
    material2.wireframe = true;
    this._obstacleMaterials.push(material0);
    this._obstacleMaterials.push(material1);
    this._obstacleMaterials.push(material2);
    this._obstacleMaterials.push(material3);
  }

  initBackground() {
    const groundMaterial = new GridMaterial('groundMaterial', this.scene);
    groundMaterial.majorUnitFrequency = 5;
    groundMaterial.minorUnitVisibility = 0.45;
    groundMaterial.gridRatio = 2;
    groundMaterial.backFaceCulling = false;
    groundMaterial.mainColor = new Color3(0, 1, 0.07);
    groundMaterial.lineColor = new Color3(1.0, 1.0, 1.0);
    groundMaterial.opacity = 0.98;
    groundMaterial.wireframe = true;
    groundMaterial.setAlphaMode(16);

    const ground = CreateGroundFromHeightMap(
      'ground',
      '/ground_heightmap.png',
      {
        width: 10000,
        height: 10000,
        subdivisions: 100,
        minHeight: 0,
        maxHeight: 1500,
        updatable: false
      },
      this.scene
    );
    ground.position.y -= 1000;
    ground.material = groundMaterial;

    const skyMaterial = new GridMaterial('skyMaterial', this.scene);
    skyMaterial.majorUnitFrequency = 5;
    skyMaterial.minorUnitVisibility = 0.45;
    skyMaterial.gridRatio = 2;
    skyMaterial.backFaceCulling = false;
    skyMaterial.mainColor = new Color3(1, 0, 0);
    skyMaterial.lineColor = new Color3(1.0, 1.0, 1.0);
    skyMaterial.opacity = 0.98;
    skyMaterial.wireframe = true;
    skyMaterial.setAlphaMode(16);

    const sky = CreateGroundFromHeightMap(
      'sky',
      '/sky_heightmap.png',
      {
        width: 10000,
        height: 10000,
        subdivisions: 100,
        minHeight: 0,
        maxHeight: 1000,
        updatable: false
      },
      this.scene
    );
    sky.position.y = 1500;
    sky.material = skyMaterial;
    sky.rotation = new Vector3(Math.PI, 0, 0);

    const networkSphere = CreateSphere('networkGraph', {
      segments: 12,
      diameter: 10000
    });
    const networkMaterial = new GridMaterial('networkMaterial', this.scene);
    networkMaterial.majorUnitFrequency = 5;
    networkMaterial.minorUnitVisibility = 0.45;
    networkMaterial.gridRatio = 2;
    networkMaterial.backFaceCulling = false;
    networkMaterial.mainColor = new Color3(0, 0, 1);
    networkMaterial.lineColor = new Color3(1.0, 1.0, 1.0);
    networkMaterial.opacity = 0.98;
    networkMaterial.wireframe = true;
    networkMaterial.setAlphaMode(5);
    networkSphere.material = networkMaterial;

    const positions = networkSphere.getVerticesData(VertexBuffer.PositionKind);
    const indices = networkSphere.getIndices();
    if (!positions) {
      throw new Error('background init fail');
    }
    const newPositions = [];
    for (let i = 0; i < positions.length; i += 3) {
      const px = positions[i],
        py = positions[i + 1],
        pz = positions[i + 2];
      const range = 500;
      const randomNum = () =>
        Math.floor(Math.random() * (range - -range + 1)) + -range;
      newPositions.push(px + randomNum(), py + randomNum(), pz + randomNum());
    }
    const vertexData = new VertexData();
    vertexData.positions = newPositions;
    vertexData.indices = indices;
    vertexData.applyToMesh(networkSphere);

    const networkNodes = [];
    for (let i = 0; i < newPositions.length; i += 3) {
      const pos = new Vector3(positions[i], positions[i + 1], positions[i + 2]);
      networkNodes.push({ pos, index: Math.floor(i / 3) });
    }
    this._networkNodes = networkNodes;

    const packetProto = MeshBuilder.CreateSphere(
      'packetProto',
      { diameter: 10 },
      this.scene
    );
    packetProto.isVisible = false;
    new GlowLayer('glow', this.scene);
    const packetMaterial = new StandardMaterial(
      'packetProtoMaterial',
      this.scene
    );
    packetMaterial.emissiveColor = Color3.White();
    packetProto.material = packetMaterial;
    this._packetProto = packetProto;

    const nodeProto = MeshBuilder.CreateSphere(
      'nodeProto',
      { diameter: 50 },
      this.scene
    );
    nodeProto.isVisible = false;
    const nodeMaterial = new StandardMaterial('nodeMaterial', this.scene);
    nodeMaterial.emissiveColor = Color3.White();
    nodeProto.material = nodeMaterial;
    this._nodeProto = nodeProto;
    for (const node of this._networkNodes) {
      if (Math.random() < 0.1) {
        const router = this._nodeProto.createInstance('router-' + node.index);
        router.position = node.pos;
        this._networkRouters.push(router);
      }
    }
  }

  private draw(g: GameClient) {
    return () => {
      try {
        if (typeof g.prota === 'undefined' || typeof g.anta === 'undefined')
          return;

        if (this.gameMode === 'powerup') {
          if (g.prota.powerShots) {
            this.protaPowerShotMode();
          }
          if (this.powerUpLines && !g.prota.powerShots) {
            this.switchToGoalCamera();
            this.powerUpLines.dispose();
            this.powerUpLines = null;
          }
        }

        for (const entity of g.hacks) {
          const ball = entity[1];
          if (ball) {
            g.prota.hitIndicator.detectIncomingHits(ball);
            ball.update();
          }
        }
        if (
          g.keyManager.deltaTime !== 0 &&
          g.frameCount - g.keyManager.deltaTime >= g.keyManager.windowFrames
        ) {
          g.keyManager.resolve();
        }
        g.prota.hud.update(g.prota, g.anta);
        if (!(g.frameCount % 3)) {
          this.updateNetworkBackground(g.frameCount);
        }
        for (const packet of this._networkPackets) {
          packet.move();
        }

        this._networkPackets = this._networkPackets.filter(
          packet => !packet.isDead(g.frameCount)
        );

        const phi = (g.frameCount * 0.1 + 0) % (Math.PI * 2);
        const ratio = 0.5 * (Math.sin(phi) + 1);
        g._packetProto.visibility = ratio;
        g.frameCount++;
      } catch (e: any) {
        console.error(e);
        this.setError(e);
      }
    };
  }

  updateNetworkBackground(frameCount: number) {
    const index = Math.floor(
      p5.prototype.random(1, this._networkNodes.length - 1)
    );
    const networkInstance = this._packetProto.createInstance('packet-' + index);
    networkInstance.position = this._networkNodes[index].pos;
    const nextIndex = Math.random() < 0.5 ? index - 1 : index + 1;
    const nextPos = this._networkNodes[nextIndex];
    const packet = new NetworkPacket(networkInstance, nextPos.pos, frameCount);
    this._networkPackets.push(packet);
  }

  protaPowerShotMode() {
    this.switchToPowerCamera();
    const points = this.castBouncingRayFromCamera(this.powerCamera);
    this.showBounces(points);
  }

  private showBounces(hits: IBounces[]) {
    const bounceLines = [];
    for (const seg of hits) {
      bounceLines.push(seg.from);
      bounceLines.push(seg.to);
    }
    if (this.powerUpLines) {
      this.powerUpLines = MeshBuilder.CreateDashedLines(
        'bounceLines',
        { points: bounceLines, instance: this.powerUpLines },
        this.scene
      );
    } else {
      this.powerUpLines = MeshBuilder.CreateDashedLines(
        'bounceLines',
        { points: bounceLines, updatable: true },
        this.scene
      );
    }
  }

  private reflect(dir: Vector3, normal: Vector3) {
    const dot = Vector3.Dot(dir, normal);
    return dir.subtract(normal.scale(2 * dot)).normalize();
  }

  // Cast bouncing ray from camera
  castBouncingRayFromCamera(camera: Camera) {
    const maxBounces = 4;
    const epsilon = 1e-3; // offset to avoid self-intersection
    const lengthPerStep = 10000;

    const hits = [] as IBounces[]; // collect hit info: {point, normal, mesh, from, to}
    const firstRay = camera.getForwardRay();
    firstRay.origin.y -= 0.5;

    let origin = firstRay.origin;
    let dir = firstRay.direction;
    for (let bounce = 0; bounce < maxBounces; bounce++) {
      const to = origin.add(dir.scale(lengthPerStep));
      const ray = new Ray(origin, dir, lengthPerStep);
      const pickInfo = this.scene.pickWithRay(ray, _mesh => {
        return true;
      });
      if (!pickInfo || !pickInfo.hit) {
        hits.push({
          from: origin.clone(),
          to: to.clone(),
          normal: Vector3.Zero(),
          hit: false
        });
        break;
      }
      const p = pickInfo.pickedPoint?.clone();
      const n =
        pickInfo.getNormal(true) || pickInfo.getNormal(false) || Vector3.Up(); // normal at hit
      if (p && n) {
        hits.push({
          from: origin.clone(),
          to: p.clone(),
          hit: true,
          normal: n.clone()
        });
        dir = this.reflect(dir, n);
        origin = p.add(dir.scale(epsilon));
      }
    }
    return hits;
  }

  async initRoom(room: Room) {
    this.room = room;
    this.initMessages(room, this);
    this.initCallbacks(room, this);
  }

  private async initCallbacks(room: Room, g: GameClient) {
    const callbacks = Callbacks.get(room);
    this.initPlayersStateCallbacks(callbacks, g);
    this.initHacksStateCallbacks(callbacks, g);
    this.initObstaclesCallbacks(callbacks, g);
  }

  initHacksStateCallbacks(callbacks: any, g: GameClient) {
    callbacks.onAdd('hacks', (entity: any, _sessionId: unknown) => {
      const hack = createHack(
        this.scene,
        createVector3(entity.x, entity.y, entity.z),
        gameConfig.hackSize
      );
      g.hacks.set(entity.id, hack);
      callbacks.onChange(entity, () => {
        const hack = g.hacks.get(entity.id);
        if (hack) {
          const pos = createVector3(entity.x, entity.y, entity.z);
          const lv = createVector3(
            entity.linearVelocityX,
            entity.linearVelocityY,
            entity.linearVelocityZ
          );
          hack.mesh.setAbsolutePosition(pos);
          hack.linearVelocity = lv;
          lv.normalize();
        }
      });
    });
    callbacks.onRemove('hacks', (entity: any, _sessionId: unknown) => {
      const hack = g.hacks.get(entity.id);
      if (hack) {
        hack.dispose();
      }
    });
  }

  initPlayersStateCallbacks(callbacks: any, g: GameClient) {
    callbacks.onAdd('players', (entity: any, sessionId: unknown) => {
      if (sessionId === g.room.sessionId) {
        const config = {
          keys: {
            columns: entity.columns,
            rows: entity.rows,
            length: entity.keyLength,
            precisionKeys: entity.precisionKeys
          },
          goalPosition: createVector3(entity.posX, entity.posY, entity.posZ),
          goalDimensions: createVector3(entity.dimX, entity.dimY, entity.dimZ),
          lifespan: entity.lifespan,
          mana: entity.mana,
          score: entity.score,
          hud: g.hud,
          room: g.room,
          username: entity.username
        };

        const player = new Protagonist(config, g.scene);
        g.prota = player;
        g.prota.initGridHints(g.scene);
        const pos = config.goalPosition;
        this.goalCameraPositions = createGoalCameraPositions(pos);
        this.goalCamera = createGoalCamera(
          g.scene,
          this.goalCameraPositions[0]
        );
        const offsetZ = pos.z > 0 ? -1 : 1;
        this.powerCamera = createPowerCamera(
          g.scene,
          createVector3(
            pos.x,
            pos.y + config.goalDimensions.y / 2,
            pos.z + offsetZ
          )
        );
        this.freeCamera = createFreeCamera(
          g.scene,
          createVector3(pos.x, pos.y, pos.z + -1 * (offsetZ * 20))
        );

        const keyManager = new KeyManager(
          g,
          () => g.frameCount,
          g.prota,
          this.gameMode
        );
        g.keyManager = keyManager;
      } else {
        const config = {
          goalPosition: createVector3(entity.posX, entity.posY, entity.posZ),
          goalDimensions: createVector3(entity.dimX, entity.dimY, entity.dimZ),
          lifespan: entity.lifespan,
          mana: entity.mana,
          score: 0,
          keys: {
            length: entity.keyLength
          },
          username: entity.username
        };
        const player = new Antagonist(config, g.scene);
        g.anta = player;
      }
      if (typeof g.prota !== 'undefined' && typeof g.anta !== 'undefined') {
        this.clientAcknowledge(g.room);
      }
      callbacks.onChange(entity, () => {
        const player = sessionId === g.room.sessionId ? g.prota : g.anta;
        player.mesh.position.x = entity.posX;
        player.mesh.position.y = entity.posY;
        player.mesh.position.z = entity.posZ;
        player.lifespan = entity.lifespan;
        player.mana = entity.mana;
        player.score = entity.score;
        player.powerShots = entity.powerShots;
        if (player === g.prota && player.powerShots && !entity.powerShots) {
          this.switchToGoalCamera();
        }
      });
    });
    callbacks.onRemove('players', (_entity: any, sessionId: unknown) => {
      const player = sessionId === g.room.sessionId ? g.prota : g.anta;
      player.dispose();
    });
  }

  initObstaclesCallbacks(callbacks: any, g: GameClient) {
    callbacks.onAdd('obstacles', (entity: any, _sessionId: unknown) => {
      try {
        const obstacle = createObstacle(
          this.scene,
          createVector3(entity.x, entity.y, entity.z),
          entity.type
        );
        obstacle.mesh.rotation.x = entity.rotationX;
        obstacle.mesh.rotation.y = entity.rotationY;
        obstacle.mesh.rotation.z = entity.rotationZ;
        obstacle.mesh.material = this._obstacleMaterials[entity.type];
        g.obstacles.set(entity.id, obstacle);
      } catch (e: any) {
        console.error(e);
        throw e;
      }
      callbacks.onChange(entity, () => {
        const obstacle = g.obstacles.get(entity.id);
        if (obstacle) {
          const pos = createVector3(entity.x, entity.y, entity.z);
          obstacle.mesh.setAbsolutePosition(pos);
          obstacle.mesh.rotation.x = entity.rotationX;
          obstacle.mesh.rotation.y = entity.rotationY;
          obstacle.mesh.rotation.z = entity.rotationZ;
        }
      });
    });
    callbacks.onRemove('obstacles', (entity: any, _sessionId: unknown) => {
      const obstacle = g.obstacles.get(entity.id);
      if (obstacle) {
        obstacle.dispose();
      }
    });
  }

  initMessages(room: Room, g: GameClient) {
    room.onMessage('game-start', message => {
      try {
        console.log('game-start');
        console.log(message);
        g.hud.changeProName(g.prota.username);
        g.hud.changeAntaName(g.anta.username);
        this.engine.hideLoadingUI();
      } catch (e: any) {
        g.setError(e);
      }
    });

    room.onMessage('game-interrupted', message => {
      try {
        console.log('game-interrupted');
        console.log(message);
        this.displayReconnectionScreen();
      } catch (e: any) {
        g.setError(e);
      }
    });

    room.onMessage('game-restart', message => {
      try {
        console.log('game-restart');
        console.log(message);
        this.engine.hideLoadingUI();
      } catch (e: any) {
        g.setError(e);
      }
    });

    room.onMessage('game-finished', message => {
      try {
        console.log('game-finished');
        console.log(message);
        this.winnerScreen.setText('winner: ' + message);
        this.displayWinnerScreen();
      } catch (e: any) {
        g.setError(e);
      }
    });
  }

  async clientAcknowledge(room: Room) {
    try {
      console.log('client-ack');
      room.send('client-ack');
    } catch (e: any) {
      this.setError(e);
    }
  }

  displayLoadingScreen() {
    this.engine.hideLoadingUI();
    this.engine.loadingScreen = this.loadingScreen;
    this.engine.displayLoadingUI();
  }

  displayReconnectionScreen() {
    this.engine.hideLoadingUI();
    this.engine.loadingScreen = this.reconnectionScreen;
    this.engine.displayLoadingUI();
  }

  displayWinnerScreen() {
    this.engine.hideLoadingUI();
    this.engine.loadingScreen = this.winnerScreen;
    this.engine.displayLoadingUI();
  }

  switchToPowerCamera() {
    if (this.scene.activeCamera === this.powerCamera) {
      return;
    }
    if (this.scene.activeCamera) {
      this.scene.activeCamera.detachControl();
    }
    const canvas = this.engine.getRenderingCanvas();
    this.powerCamera.attachControl(canvas, true);
    this.scene.activeCamera = this.powerCamera;
  }

  switchToGoalCamera() {
    if (this.scene.activeCamera === this.goalCamera) {
      return;
    }
    if (this.scene.activeCamera) {
      this.scene.activeCamera.detachControl();
    }
    const canvas = this.engine.getRenderingCanvas();
    this.goalCamera.attachControl(canvas, true);
    this.scene.activeCamera = this.goalCamera;
  }

  switchToFreeCamera() {
    if (this.scene.activeCamera === this.freeCamera) {
      return;
    }
    if (this.scene.activeCamera) {
      this.scene.activeCamera.detachControl();
    }
    const canvas = this.engine.getRenderingCanvas();
    this.freeCamera.attachControl(canvas, true);
    this.scene.activeCamera = this.freeCamera;
  }

  private set defaultScene(defaultScene: Scene) {
    this._defaultScene = defaultScene;
  }
  private set scene(scene: Scene) {
    this._scene = scene;
  }
  private set engine(engine: AbstractEngine) {
    this._engine = engine;
  }
  private set gameMode(gameMode: string) {
    this._gameMode = gameMode;
  }
  private set matchId(matchId: string) {
    this._matchId = matchId;
  }
  private set setError(setError: Dispatch<SetStateAction<Error | null>>) {
    this._setError = setError;
  }
  private set frameCount(frameCount: number) {
    this._frameCount = frameCount;
  }
  private set arena(arena: Arena) {
    this._arena = arena;
  }
  private set prota(prota: Protagonist) {
    this._protagonist = prota;
  }
  private set anta(anta: Antagonist) {
    this._antagonist = anta;
  }
  private set hud(hud: Hud) {
    this._hud = hud;
  }
  private set keyManager(keyManager: KeyManager) {
    this._keyManager = keyManager;
  }
  private set hacks(hacks: Map<string, Hack>) {
    this._hacks = hacks;
  }
  private set powerUpLines(lines: LinesMesh | null) {
    this._powerUpLines = lines;
  }
  private set room(room: Room) {
    this._room = room;
  }
  private set initialized(value: boolean) {
    this._initialized = value;
  }
  private set loadingScreen(loadingScreen: LoadingScreen) {
    this._loadingScreen = loadingScreen;
  }
  private set reconnectionScreen(reconnectionScreen: ReconnectionScreen) {
    this._reconnectionScreen = reconnectionScreen;
  }
  private set winnerScreen(winnerScreen: WinnerScreen) {
    this._winnerScreen = winnerScreen;
  }
  private set goalCamera(goalCamera: Camera) {
    this._goalCamera = goalCamera;
  }
  private set goalCameraPositions(positions: Vector3[]) {
    this._goalCameraPositions = positions;
  }
  private set powerCamera(powerCamera: Camera) {
    this._powerCamera = powerCamera;
  }
  private set light(light: Light) {
    this._light = light;
  }
  private set backgroundMusic(backgroundMusic: Sound) {
    this._backgroundMusic = backgroundMusic;
  }

  private get defaultScene() {
    return this._defaultScene;
  }
  public get scene(): Scene {
    return this._scene;
  }
  // NOTE: set to public to dispose scene on error
  public get engine(): AbstractEngine {
    return this._engine;
  }
  public get gameMode(): string {
    return this._gameMode;
  }
  public get matchId(): string {
    return this._matchId;
  }
  private get setError() {
    return this._setError;
  }
  private get frameCount(): number {
    return this._frameCount;
  }
  private get arena(): Arena {
    return this._arena;
  }
  private get prota(): Protagonist {
    return this._protagonist;
  }
  private get anta(): Antagonist {
    return this._antagonist;
  }
  private get hud(): Hud {
    return this._hud;
  }
  private get keyManager(): KeyManager {
    return this._keyManager;
  }
  private get hacks(): Map<string, Hack> {
    return this._hacks;
  }
  private get powerUpLines() {
    return this._powerUpLines;
  }
  private get initialized(): boolean {
    return this._initialized;
  }
  private get loadingScreen(): LoadingScreen {
    return this._loadingScreen;
  }
  private get reconnectionScreen(): ReconnectionScreen {
    return this._reconnectionScreen;
  }
  private get winnerScreen(): WinnerScreen {
    return this._winnerScreen;
  }
  private get room(): Room {
    return this._room;
  }
  public get goalCamera(): Camera {
    return this._goalCamera;
  }
  public get goalCameraPositions(): Vector3[] {
    return this._goalCameraPositions;
  }
  private get powerCamera(): Camera {
    return this._powerCamera;
  }
  private get light(): Light {
    return this._light;
  }
  private get backgroundMusic(): Sound {
    return this._backgroundMusic;
  }
}

/* v8 ignore stop */
