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
import { Obstacle } from '#rooms/entities/obstacles.js';

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

export function createObstacle(
  id: number,
  scene: Scene,
  pos: Vector3,
  type: number
) {
  let mesh;
  if (type === 1) {
    mesh = MeshBuilder.CreateBox(
      'obstacle-box',
      { width: 5, height: 2 },
      scene
    );
  } else if (type === 2) {
    mesh = MeshBuilder.CreatePolyhedron(
      'obstacle-polyhedron',
      { size: 3 },
      scene
    );
  } else {
    throw new Error('invalid obstacle type');
  }
  const obstacle = new Obstacle(id, type, mesh, pos, scene);
  return obstacle;
}

export function createPowerShot(
  scene: Scene,
  pos: Vector3,
  force: Vector3,
  diameter: number
) {
  const hack = createHack(scene, pos, diameter);

  hack.physicsMesh.aggregate.body.applyForce(
    force.scale(4),
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
