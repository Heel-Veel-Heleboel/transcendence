import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { Inspector } from '@babylonjs/inspector';

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;

const engine = new BABYLON.Engine(canvas) as BABYLON.AbstractEngine;

const createScene = function () {
  const sceneObj = new BABYLON.Scene(engine);

  sceneObj.createDefaultLight();
  const _camera = new BABYLON.UniversalCamera(
    'camera',
    new BABYLON.Vector3(0, 5, -10),
    sceneObj
  );
  _camera.attachControl(true);
  _camera.inputs.addMouseWheel();
  _camera.setTarget(BABYLON.Vector3.Zero());
  // const _sphere = BABYLON.MeshBuilder.CreateSphere(
  //   'sphere',
  //   { diameter: 2, segments: 32 },
  //   sceneObj
  // );
  //
  // const sphereMaterial = new BABYLON.StandardMaterial();
  // _sphere.material = sphereMaterial;
  //
  // sphereMaterial.ambientColor = new BABYLON.Color3(0, 1, 0);
  // sceneObj.ambientColor = new BABYLON.Color3(1, 1, 0);
  //
  // sphereMaterial.emissiveColor = new BABYLON.Color3(0.5, 1, 0.5);
  //
  // const _ground = BABYLON.MeshBuilder.CreateGround(
  //   'ground',
  //   {
  //     height: 10,
  //     width: 10
  //   },
  //   sceneObj
  // );

  BABYLON.SceneLoader.ImportMesh('', '/', 'coffee_table.gltf', sceneObj);

  const bgMusic = new BABYLON.Sound(
    'mySong',
    '/public/loop.mp3',
    sceneObj,
    null,
    {
      loop: true,
      autoplay: true
    }
  );

  // _ground.material = new BABYLON.StandardMaterial();
  // _ground.material.wireframe = true;
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
