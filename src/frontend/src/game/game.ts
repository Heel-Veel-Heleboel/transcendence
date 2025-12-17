import * as module from './game.ts';
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
import { Arena } from './arena.ts';
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

export function addBall(scene) {
  let temp = createBall(scene, new BABYLON.Vector3(0, 0, 0), 1);
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
  // @ts-ignore
  const _bgMusic = createBgMusic(scene);

  // @ts-ignore
  const _camera = createCamera(scene);
  // @ts-ignore
  const _lightUp = createLight(scene);
  const light = new BABYLON.PointLight(
    'pointLight',
    new BABYLON.Vector3(0, 0, 0),
    scene
  );
  // An extra step is needed in order to be able to physicalize meshes coming from gltf. Insert an extra node transform just before the __root__ so conversion between Righ or Left handedness are transparent for the physics engine.
  const trParent = new BABYLON.TransformNode('tr', scene);
  const root = scene.getMeshByName('__root__');
  if (root) {
    root.scaling.scaleInPlace(100);
    root.position.y = 4;
    root.setParent(trParent);
  }
  const arena = createArena();
  await arena.initMesh(scene);

  console.log(arena.goal_1);
  const player = new Player(
    arena.goal_1.mesh.absolutePosition,
    arena.goal_1.mesh.getBoundingInfo().boundingBox.extendSizeWorld.scale(2),
    scene
  );
  const player2 = new Player(
    arena.goal_2.mesh.absolutePosition,
    arena.goal_2.mesh.getBoundingInfo().boundingBox.extendSizeWorld.scale(2),
    scene
  );
  console.log(arena);

  const observable_1 = arena.goal_1.aggregate.body.getCollisionObservable();
  const observer = observable_1.add(collisionEvent => {
    console.log('goal_1');
    // Process collisions for the player
  });

  const observable_2 = arena.goal_2.aggregate.body.getCollisionObservable();
  const observer_2 = observable_2.add(collisionEvent => {
    console.log('goal_2');
    // Process collisions for the player
  });

  const balls = [];
  const ball = addBall(scene);
  balls.push(ball);
  let frameCount = 0;
  scene.onBeforeRenderObservable.add(module.draw(scene, balls, frameCount));
  return scene;
}

export function draw(scene: Scene, balls: Ball[], frameCount) {
  return () => {
    if (!(frameCount % 600)) {
      const ball = addBall(scene);
      balls.push(ball);
    }
    for (const ball of balls) {
      ball.update();
    }
    balls.filter(ball => {
      !ball.isDead();
    });
    frameCount++;
  };
}
