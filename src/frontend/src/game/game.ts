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
  const ball = createBall(scene, 0.1);
  const arena = createArena(scene);

  scene.onBeforeRenderObservable.add(module.draw(ball, arena));
  scene.onPointerDown = function () {
    ball.aggregate.body.applyForce(
      new BABYLON.Vector3(0, 100, 0),
      ball.mesh.absolutePosition
    );
  };
  return scene;
}

export function draw(ball: Ball, arena: Arena) {
  return () => {
    ball.update();
    // console.log(ball.mesh.position);
  };
}
