import {
  Scene,
  Sound,
  ArcRotateCamera,
  MeshBuilder,
  Vector3,
  HemisphericLight,
  Color3
} from '@babylonjs/core';
import { Hack } from '../components/ball.ts';
import { Arena } from '../components/arena.ts';

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

export function createHack(scene: Scene, pos: Vector3, diameter: number) {
  const _hack = MeshBuilder.CreateSphere(
    'hack',
    {
      diameter: diameter
    },
    scene
  );

  const hack = new Hack(_hack, pos);
  return hack;
}

export function createLight(scene: Scene) {
  const light = new HemisphericLight('hemiLight', new Vector3(-1, 1, 0), scene);
  light.diffuse = new Color3(1, 0, 0);
  light.specular = new Color3(0, 1, 0);
  light.groundColor = new Color3(0, 1, 0);
  return light;
}

export function createBgMusic(scene: Scene) {
  const bg = new Sound('mySong', '/public/loop.mp3', scene, null, {
    loop: true,
    autoplay: true
  });
  return bg;
}
