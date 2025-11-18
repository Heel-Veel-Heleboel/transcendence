import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { Inspector } from '@babylonjs/inspector';

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;

const engine = new BABYLON.Engine(canvas) as BABYLON.AbstractEngine;

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

const createScene = function () {
  const sceneObj = new BABYLON.Scene(engine);

  const _bgMusic = new BABYLON.Sound(
    'mySong',
    '/public/loop.mp3',
    sceneObj,
    null,
    {
      loop: true,
      autoplay: true
    }
  );

  sceneObj.createDefaultCameraOrLight(true, false, true);
  // const _camera = new BABYLON.UniversalCamera(
  //   'camera',
  //   new BABYLON.Vector3(0.1, 0.1, -4),
  //   sceneObj
  // );
  // _camera.attachControl(true);
  // _camera.inputs.addMouseWheel();
  // _camera.setTarget(BABYLON.Vector3.Zero());

  // BABYLON.SceneLoader.ImportMesh('', '/', 'coffee_table.gltf', sceneObj);

  // const _arenaMaterial = new BABYLON.StandardMaterial('arenaTexture', sceneObj);

  // const _arena = BABYLON.MeshBuilder.CreateBox(
  //   'arena',
  //   { height: 3, width: 3, depth: 8 },
  //   sceneObj
  // );
  //
  // _arena.material = _arenaMaterial;
  // if (_arena.material) {
  //   _arena.material.wireframe = true;
  // }
  //

  const _rightSide = BABYLON.MeshBuilder.CreatePlane(
    'rightSide',
    {
      height: 2,
      width: 1,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    },
    sceneObj
  );
  _rightSide.rotation = new BABYLON.Vector3(0, Math.PI / 2, Math.PI / 2);
  _rightSide.position = new BABYLON.Vector3(-1, 0, 0);

  const _leftSide = BABYLON.MeshBuilder.CreatePlane(
    'leftSide',
    {
      height: 2,
      width: 1,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    },
    sceneObj
  );
  _leftSide.rotation = new BABYLON.Vector3(0, Math.PI / 2, Math.PI / 2);
  _leftSide.position = new BABYLON.Vector3(1, 0, 0);

  const _upside = BABYLON.MeshBuilder.CreatePlane(
    'upside',
    {
      height: 2,
      width: 2,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    },
    sceneObj
  );
  _upside.rotation = new BABYLON.Vector3(Math.PI / 2, 0, 0);
  _upside.position = new BABYLON.Vector3(0, 0.5, 0);

  const _downside = BABYLON.MeshBuilder.CreatePlane(
    'downside',
    {
      height: 2,
      width: 2,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    },
    sceneObj
  );
  _downside.rotation = new BABYLON.Vector3(Math.PI / 2, 0, 0);
  _downside.position = new BABYLON.Vector3(0, -0.5, 0);

  const _frontGoal = BABYLON.MeshBuilder.CreatePlane(
    'frontGoal',
    {
      height: 2,
      width: 1,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    },
    sceneObj
  );
  _frontGoal.rotation = new BABYLON.Vector3(0, 0, Math.PI / 2);
  _frontGoal.position = new BABYLON.Vector3(0, 0, 1);

  const _backGoal = BABYLON.MeshBuilder.CreatePlane(
    'backGoal',
    {
      height: 2,
      width: 1,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    },
    sceneObj
  );
  _backGoal.rotation = new BABYLON.Vector3(0, 0, Math.PI / 2);
  _backGoal.position = new BABYLON.Vector3(0, 0, -1);

  const _ball = BABYLON.MeshBuilder.CreateSphere(
    'ball',
    {
      diameter: 0.1
    },
    sceneObj
  );

  const ball = new Ball(_ball, new BABYLON.Vector3(0, 0, 0));

  const arena: BABYLON.Mesh[] = [];

  arena.push(_leftSide);
  arena.push(_rightSide);
  arena.push(_upside);
  arena.push(_downside);
  arena.push(_frontGoal);
  arena.push(_backGoal);

  sceneObj.onBeforeRenderObservable.add(() => {
    ball.update();
    ball.checkBorders(arena);
    console.log(ball.mesh.position);
  });
  return sceneObj;
};

const scene = createScene();

engine.runRenderLoop(function () {
  scene.render();
});

window.addEventListener('resize', function () {
  engine.resize();
});

Inspector.Show(scene, {});
