import {
  Scene,
  ArcRotateCamera,
  MeshBuilder,
  Vector3,
  HemisphericLight,
  Color3
} from '@babylonjs/core';
import { Ball } from '#entities/Ball.js';
import { Arena } from '#entities/Arena.js';

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
