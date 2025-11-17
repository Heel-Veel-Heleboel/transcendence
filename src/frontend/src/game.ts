import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { Inspector } from '@babylonjs/inspector';

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;

const engine = new BABYLON.Engine(canvas) as BABYLON.AbstractEngine;

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
  //   new BABYLON.Vector3(0, 5, -10),
  //   sceneObj
  // );
  // _camera.attachControl(true);
  // _camera.inputs.addMouseWheel();
  // _camera.setTarget(BABYLON.Vector3.Zero());
  //
  // BABYLON.SceneLoader.ImportMesh('', '/', 'coffee_table.gltf', sceneObj);

  const _arenaMaterial = new BABYLON.StandardMaterial('arenaTexture', sceneObj);

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

  const _ball = BABYLON.MeshBuilder.CreateSphere(
    'ball',
    {
      diameter: 0.1
    },
    sceneObj
  );

  const sides: BABYLON.Mesh[] = [];

  sides.push(_rightSide);
  sides.push(_leftSide);

  let direction = true;
  sceneObj.onBeforeRenderObservable.add(() => {
    if (direction) {
      _ball.position.x += 0.01;
    } else {
      _ball.position.x -= 0.01;
    }
    for (const side of sides) {
      if (_ball.intersectsMesh(side)) {
        direction = !direction;
        if (direction) {
          _ball.position.x += 0.05;
        } else {
          _ball.position.x -= 0.05;
        }
      }
    }
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
