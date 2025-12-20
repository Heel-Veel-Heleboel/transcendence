import * as module from './game.ts';
import { World } from './World.ts';
import * as BABYLON from '@babylonjs/core';
import {
  createEngine,
  createBgMusic,
  createBall,
  createArena,
  createCamera,
  createLight
} from './createScene.ts';
import { getCanvas, engineResize } from './sceneUtils.ts';
import '@babylonjs/loaders/glTF';
import { Ball } from './ball.ts';
import { Player } from './player.ts';
import { KeyManager } from './KeyManager.ts';
import { KeyGrid } from './KeyGrid.ts';
// import { Inspector } from '@babylonjs/inspector';

export async function initGame() {
  const canvas = getCanvas();
  const engine = createEngine(canvas);
  const defaultScene = new BABYLON.Scene(engine);
  const havokInstance = await HavokPhysics();
  // pass the engine to the plugin
  const hk = new BABYLON.HavokPlugin(true, havokInstance);
  // enable physics in the scene with a gravity
  defaultScene.enablePhysics(new BABYLON.Vector3(0, 0, 0), hk);
  const scene = await module.Scene(defaultScene);

  window.addEventListener('resize', engineResize(engine));
  // Inspector.Show(scene, {});
  engine.runRenderLoop(function () {
    scene.render();
  });
  // initial resolution is blurry, no clue why, hacky fix in order to make resolutio sharp
  setTimeout(() => {
    engine.resize();
  }, 10);
}

export function addBall(scene: BABYLON.Scene) {
  const temp = createBall(scene, new BABYLON.Vector3(0, 0, 0), 1);
  temp.physicsMesh.aggregate.body.applyForce(
    new BABYLON.Vector3(
      Math.random() * 100,
      Math.random() * 100,
      Math.random() * 100
    ),
    temp.physicsMesh.mesh.absolutePosition
  );
  return temp;
}

export async function Scene(scene: BABYLON.Scene) {
  const world = new World(scene);
  const gizmoManager = new BABYLON.GizmoManager(scene);
  // gizmoManager.boundingBoxGizmoEnabled = true;
  gizmoManager.positionGizmoEnabled = true;
  // @ts-ignore
  createBgMusic(scene);

  // @ts-ignore
  createCamera(scene);
  // @ts-ignore
  createLight(scene);
  new BABYLON.PointLight('pointLight', new BABYLON.Vector3(0, 0, 0), scene);
  const arena = createArena();
  await arena.initMesh(scene);
  world.arena = arena;

  const keyManager = new KeyManager(scene, () => world.frameCount);
  world.keyManager = keyManager;

  // create keyGrid
  const keyGrid = new KeyGrid('qwertyuiop', 'qwertyuiop');
  console.log(keyGrid);
  // add Keys to player
  const player = new Player(
    arena.goal_1.mesh.absolutePosition,
    arena.goal_1.mesh.getBoundingInfo().boundingBox.extendSizeWorld.scale(2),
    keyGrid,
    scene
  );
  // give register keyEvent from player ['qe', { x, y }] with KeyManager
  world.localPlayer = player;
  const player2 = new Player(
    arena.goal_2.mesh.absolutePosition,
    arena.goal_2.mesh.getBoundingInfo().boundingBox.extendSizeWorld.scale(2),
    keyGrid,
    scene
  );
  player.initGridColumnsHints(scene);
  player.initGridRowsHints(scene);

  world.remotePlayer = player2;

  const observable_1 = arena.goal_1.aggregate.body.getCollisionObservable();
  observable_1.add(collisionEvent => {
    console.log('goal_1');
    // Process collisions for the player
  });

  const observable_2 = arena.goal_2.aggregate.body.getCollisionObservable();
  observable_2.add(collisionEvent => {
    console.log('goal_2');
    // Process collisions for the player
  });

  const balls = [];
  const ball = addBall(scene);
  balls.push(ball);
  scene.onBeforeRenderObservable.add(module.draw(world, balls));
  return scene;
}

export function draw(w: World, balls: Ball[]) {
  return () => {
    if (!(w.frameCount % 600)) {
      const ball = addBall(w.scene);
      balls.push(ball);
    }
    for (const ball of balls) {
      ball.update();
    }
    balls.filter(ball => {
      !ball.isDead();
    });
    if (
      w.keyManager.deltaTime !== 0 &&
      w.frameCount - w.keyManager.deltaTime > w.keyManager.windowFrames
    ) {
      w.keyManager.resolve();
    }
    w.frameCount++;
  };
}
