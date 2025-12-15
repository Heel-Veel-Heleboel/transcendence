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
  const scene = module.Scene(defaultScene);

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

export function Scene(scene: BABYLON.Scene) {
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
  const below = createArena(
    scene,
    new BABYLON.Vector3(0, 0, 0),
    new BABYLON.Vector3(0, 1, 0),
    0
  );
  const north = createArena(
    scene,
    new BABYLON.Vector3(0, 0, 4),
    new BABYLON.Vector3(1, 0, 0),
    -Math.PI / 2
  );
  const south = createArena(
    scene,
    new BABYLON.Vector3(0, 0, -4),
    new BABYLON.Vector3(1, 0, 0),
    Math.PI / 2
  );
  const west = createArena(
    scene,
    new BABYLON.Vector3(4, 0, 0),
    new BABYLON.Vector3(0, 0, 1),
    Math.PI / 2
  );
  const east = createArena(
    scene,
    new BABYLON.Vector3(-4, 0, 0),
    new BABYLON.Vector3(0, 0, 1),
    -Math.PI / 2
  );
  const above = createArena(
    scene,
    new BABYLON.Vector3(0, 2, 0),
    new BABYLON.Vector3(0, 1, 0),
    0
  );

  const ball = createBall(scene, new BABYLON.Vector3(0, 1, 0), 0.1);
  for (let i = 0; i < 10; i++) {
    let temp = createBall(scene, new BABYLON.Vector3(0, 1, 0), 0.1);
    temp.aggregate.body.applyForce(
      new BABYLON.Vector3(
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100
      ),
      temp.mesh.absolutePosition
    );
  }
  scene.onBeforeRenderObservable.add(module.draw(ball, above));
  return scene;
}

export function draw(ball: Ball, arena: Arena) {
  return () => {
    console.log('linear' + ball.aggregate.body.getLinearVelocity());
    console.log('angular' + ball.aggregate.body.getAngularVelocity());
    console.log(ball.aggregate.body.getAngularVelocity());
    // ball.update();
    // console.log(ball.mesh.position);
  };
}
