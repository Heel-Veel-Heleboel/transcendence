import {
  Engine,
  Scene,
  PhysicsAggregate,
  PhysicsShapeType,
  AbstractEngine,
  Sound,
  ArcRotateCamera,
  MeshBuilder,
  Mesh,
  Vector3,
  HemisphericLight,
  Color3
} from '@babylonjs/core';
import { Ball } from './ball';
import { Arena } from './arena.ts';
import * as module from './createScene.ts';

export function createEngine(canvas: HTMLCanvasElement) {
  const engine = new Engine(canvas) as AbstractEngine;
  return engine;
}

export function createBgMusic(scene: Scene) {
  const bg = new Sound('mySong', '/public/loop.mp3', scene, null, {
    loop: true,
    autoplay: true
  });
  return bg;
}

export function createCamera(scene: Scene, distance: number) {
  const camera = new ArcRotateCamera(
    'camera',
    -Math.PI / 2,
    Math.PI / 2,
    distance,
    Vector3.Zero(),
    scene
  );
  camera.attachControl(scene.getEngine().getRenderingCanvas(), true);
  return camera;
}

export function createPlane(
  scene: Scene,
  name: string,
  height: number,
  width: number
) {
  const side = MeshBuilder.CreatePlane(
    name,
    {
      height: height,
      width: width,
      sideOrientation: Mesh.DOUBLESIDE
    },
    scene
  );
  return side;
}

export function createArena() {
  const arena = new Arena();
  return arena;
}

export function createBall(scene: Scene, pos: Vector3, diameter: number) {
  const _ball = MeshBuilder.CreateSphere(
    'ball',
    {
      diameter: diameter
    },
    scene
  );

  const ball = new Ball(_ball, pos, scene);
  return ball;
}

export function createLight(scene: Scene) {
  const light = new HemisphericLight('hemiLight', new Vector3(-1, 1, 0), scene);
  light.diffuse = new Color3(1, 0, 0);
  light.specular = new Color3(0, 1, 0);
  light.groundColor = new Color3(0, 1, 0);
  return light;
}
