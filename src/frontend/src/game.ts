import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
// import { Inspector } from '@babylonjs/inspector';

interface IBall {
  mesh: BABYLON.Mesh;
  acceleration: BABYLON.Vector3;
  velocity: BABYLON.Vector3;
}

class Ball implements IBall {
  public mesh: BABYLON.Mesh;
  public acceleration: BABYLON.Vector3;
  public velocity: BABYLON.Vector3;

  constructor(ball: BABYLON.Mesh, position: BABYLON.Vector3) {
    this.mesh = ball;
    this.mesh.position = position;
    this.acceleration = new BABYLON.Vector3(
      Math.random() * 0.1,
      Math.random() * 0.1,
      Math.random() * 0.1
    );
    this.velocity = new BABYLON.Vector3();
  }

  checkBorders(arena: BABYLON.Mesh[]): void {
    if (this.mesh.position.x < arena[0].position.x) {
      this.acceleration.x *= -1;
    }
    if (this.mesh.position.x > arena[1].position.x) {
      this.acceleration.x *= -1;
    }
    if (this.mesh.position.y > arena[2].position.y) {
      this.acceleration.y *= -1;
    }
    if (this.mesh.position.y < arena[3].position.y) {
      this.acceleration.y *= -1;
    }
    if (this.mesh.position.z > arena[4].position.z) {
      this.acceleration.z *= -1;
    }
    if (this.mesh.position.z < arena[5].position.z) {
      this.acceleration.z *= -1;
    }
  }

  update(): void {
    // this.velocity.addInPlace(this.acceleration);
    // this.velocity.normalize();
    this.mesh.position.addInPlace(this.acceleration);
  }
}

export function createEngine(canvas: HTMLCanvasElement) {
  const engine = new BABYLON.Engine(canvas) as BABYLON.AbstractEngine;
  return engine;
}

export function getCanvas() {
  const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
  return canvas;
}

export function createBgMusic(scene: BABYLON.Scene) {
  const bg = new BABYLON.Sound('mySong', '/public/loop.mp3', scene, null, {
    loop: true,
    autoplay: true
  });
  return bg;
}

export function createCamera(scene: BABYLON.Scene) {
  scene.createDefaultCameraOrLight(true, false, true);
}

export function createPlane(
  scene: BABYLON.Scene,
  name: string,
  height: number,
  width: number
) {
  const side = BABYLON.MeshBuilder.CreatePlane(
    name,
    {
      height: height,
      width: width,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    },
    scene
  );
  return side;
}

export function createArena(scene: BABYLON.Scene) {
  const arena: BABYLON.Mesh[] = [];
  const rightSide = createPlane(scene, 'rightSide', 2, 1);
  rightSide.rotation = new BABYLON.Vector3(0, Math.PI / 2, Math.PI / 2);
  rightSide.position = new BABYLON.Vector3(-1, 0, 0);

  const leftSide = createPlane(scene, 'leftSide', 2, 1);
  leftSide.rotation = new BABYLON.Vector3(0, Math.PI / 2, Math.PI / 2);
  leftSide.position = new BABYLON.Vector3(1, 0, 0);

  const upSide = createPlane(scene, 'upSide', 2, 2);
  upSide.rotation = new BABYLON.Vector3(Math.PI / 2, 0, 0);
  upSide.position = new BABYLON.Vector3(0, 0.5, 0);

  const downSide = createPlane(scene, 'downSide', 2, 2);
  downSide.rotation = new BABYLON.Vector3(Math.PI / 2, 0, 0);
  downSide.position = new BABYLON.Vector3(0, -0.5, 0);

  const frontGoal = createPlane(scene, 'frontGoal', 2, 1);
  frontGoal.rotation = new BABYLON.Vector3(0, 0, Math.PI / 2);
  frontGoal.position = new BABYLON.Vector3(0, 0, 1);

  const backGoal = createPlane(scene, 'backGoal', 2, 1);
  backGoal.rotation = new BABYLON.Vector3(0, 0, Math.PI / 2);
  backGoal.position = new BABYLON.Vector3(0, 0, -1);

  arena.push(leftSide);
  arena.push(rightSide);
  arena.push(upSide);
  arena.push(downSide);
  arena.push(frontGoal);
  arena.push(backGoal);
  return arena;
}

export function createBall(scene: BABYLON.Scene, diameter: number) {
  const _ball = BABYLON.MeshBuilder.CreateSphere(
    'ball',
    {
      diameter: diameter
    },
    scene
  );
  const ball = new Ball(_ball, new BABYLON.Vector3(0, 0, 0));
  return ball;
}

export function createScene(engine: BABYLON.AbstractEngine) {
  const scene = new BABYLON.Scene(engine);

  const _bgMusic = createBgMusic(scene);
  createCamera(scene);
  const ball = createBall(scene, 0.1);
  const arena: BABYLON.Mesh[] = createArena(scene);

  scene.onBeforeRenderObservable.add(() => {
    ball.update();
    ball.checkBorders(arena);
    console.log(ball.mesh.position);
  });
  return scene;
}

export function initGame() {
  const canvas = getCanvas();
  const engine = createEngine(canvas);
  const scene = createScene(engine);

  window.addEventListener('resize', function () {
    engine.resize();
  });
  // Inspector.Show(scene, {});
  engine.runRenderLoop(function () {
    scene.render();
  });
}
