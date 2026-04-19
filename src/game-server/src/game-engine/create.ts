import {
  Scene,
  ArcRotateCamera,
  MeshBuilder,
  Vector3,
  HemisphericLight,
  Color3
} from '@babylonjs/core';
import { Hack } from '#entities/hack.js';
import { Arena } from '#entities/arena.js';

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

  const hack = new Hack(_hack, pos, scene);
  return hack;
}

export function createPowerShot(
  scene: Scene,
  pos: Vector3,
  force: Vector3,
  diameter: number
) {
  const hack = createHack(scene, pos, diameter);
  hack.x = hack.physicsMesh.mesh.position.x;
  hack.y = hack.physicsMesh.mesh.position.y;
  hack.z = hack.physicsMesh.mesh.position.z;
  hack.linearVelocityX = 0;
  hack.linearVelocityY = 0;
  hack.linearVelocityZ = 0;

  hack.physicsMesh.aggregate.body.applyForce(
    force,
    hack.physicsMesh.mesh.absolutePosition
  );

  return hack;
}

export function createLight(scene: Scene) {
  const light = new HemisphericLight('hemiLight', new Vector3(-1, 1, 0), scene);
  light.diffuse = new Color3(1, 0, 0);
  light.specular = new Color3(0, 1, 0);
  light.groundColor = new Color3(0, 1, 0);
  return light;
}
