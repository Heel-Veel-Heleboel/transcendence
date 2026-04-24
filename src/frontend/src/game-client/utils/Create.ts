import {
  Scene,
  Sound,
  MeshBuilder,
  Vector3,
  HemisphericLight,
  Color3,
  StandardMaterial,
  LinesMesh,
  TransformNode,
  HavokPlugin,
  UniversalCamera
} from '@babylonjs/core';
import { Hack } from '../components/Hack.ts';
import gameConfig from './GameConfig.ts';
import Errors from './Error.ts';
import { AdvancedDynamicTexture } from '@babylonjs/gui';

/* v8 ignore start */
export function createGoalCamera(scene: Scene, pos: Vector3) {
  const camera = new UniversalCamera('goalCamera', pos, scene);
  camera.setTarget(Vector3.Zero());
  if (unitializedCheck(camera)) {
    throw new Error(Errors.FAILED_ENTITY_INIT);
  }
  camera.inputs.addMouse();
  camera.inputs.addMouseWheel();

  return camera;
}

export function createPowerCamera(scene: Scene, pos: Vector3) {
  const camera = new UniversalCamera('powerCamera', pos, scene);
  camera.setTarget(Vector3.Zero());
  if (unitializedCheck(camera)) {
    throw new Error(Errors.FAILED_ENTITY_INIT);
  }

  camera.inputs.addMouse();
  camera.inputs.addMouseWheel();

  return camera;
}

export function createHack(scene: Scene, pos: Vector3, diameter: number) {
  const time = Math.floor(Date.now() / 1000);
  const _hack = MeshBuilder.CreateSphere(
    gameConfig.hackName + time,
    {
      diameter: diameter
    },
    scene
  );
  _hack.isPickable = false;
  const material = new StandardMaterial('hackMaterial', scene);
  material.ambientColor = new Color3(0, 1, 0);
  material.diffuseColor = new Color3(0, 1, 0);
  if (unitializedCheck(_hack) || unitializedCheck(material)) {
    throw new Error(Errors.FAILED_MESH_INIT);
  }
  const hack = new Hack(_hack, pos);
  hack.mesh.material = material;
  return hack;
}

export function createLight(scene: Scene) {
  const light = new HemisphericLight(
    gameConfig.lightName,
    createVector3(-1, 1, 0),
    scene
  );
  if (unitializedCheck(light)) {
    throw new Error(Errors.FAILED_ENTITY_INIT);
  }
  light.diffuse = createColor3(1, 0, 0);
  light.specular = createColor3(0, 1, 0);
  light.groundColor = createColor3(0, 1, 0);
  return light;
}

export function createBgMusic(scene: Scene) {
  const bg = new Sound(
    gameConfig.bgSoundName,
    gameConfig.bgSoundPath,
    scene,
    null,
    {
      loop: true,
      autoplay: true
    }
  );
  if (unitializedCheck(bg)) {
    throw new Error(Errors.FAILED_ENTITY_INIT);
  }
  return bg;
}

export function createStandardMaterial(name: string, scene: Scene) {
  const material = new StandardMaterial(name, scene);
  if (unitializedCheck(material)) {
    throw new Error(Errors.FAILED_MATERIAL_INIT);
  }
  return material;
}

export function createNewLines(
  name: string,
  options: { points: Vector3[]; updatable: boolean },
  scene: Scene
) {
  const lines = MeshBuilder.CreateLines(name, options, scene);
  if (unitializedCheck(lines)) {
    throw new Error(Errors.FAILED_LINES_INIT);
  }
  return lines;
}

export function createUpdatedLines(
  name: string,
  options: {
    points: Vector3[];
    updatable: boolean;
    instance: LinesMesh;
  }
) {
  const lines = MeshBuilder.CreateLines(name, options);
  if (unitializedCheck(lines)) {
    throw new Error(Errors.FAILED_LINES_INIT);
  }
  return lines;
}

export function createVector3(x: number, y: number, z: number) {
  const v = new Vector3(x, y, z);
  if (unitializedCheck(v)) {
    throw new Error(Errors.FAILED_ENTITY_INIT);
  }
  return v;
}

export function createAdvancedDynamicTexture(
  name: string,
  foreground: boolean,
  scene: Scene
) {
  const texture = AdvancedDynamicTexture.CreateFullscreenUI(
    name,
    foreground,
    scene
  );
  if (unitializedCheck(texture)) {
    throw new Error(Errors.FAILED_TEXTURE_INIT);
  }
  return texture;
}

export function createBox(
  name: string,
  options: { height: number; width: number; depth: number },
  scene: Scene
) {
  const box = MeshBuilder.CreateBox(name, options, scene);
  if (unitializedCheck(box)) {
    throw new Error(Errors.FAILED_MESH_INIT);
  }
  return box;
}

export function createSphere(
  name: string,
  options: { diameter: number },
  scene: Scene
) {
  const sphere = MeshBuilder.CreateSphere(name, options, scene);
  if (unitializedCheck(sphere)) {
    throw new Error(Errors.FAILED_MESH_INIT);
  }
  return sphere;
}

export function createDisc(
  name: string,
  options: { radius: number; sideOrientation: number },
  scene: Scene
) {
  const disc = MeshBuilder.CreateDisc(name, options, scene);
  if (unitializedCheck(disc)) {
    throw new Error(Errors.FAILED_MESH_INIT);
  }
  return disc;
}

export function createColorLerp(
  startColor: Color3,
  EndColor: Color3,
  amount: number
) {
  const color = Color3.Lerp(startColor, EndColor, amount);
  if (unitializedCheck(color)) {
    throw new Error(Errors.FAILED_ENTITY_INIT);
  }
  return color;
}

export function createColor3(r: number, g: number, b: number) {
  const color = new Color3(r, g, b);
  if (unitializedCheck(color)) {
    throw new Error(Errors.FAILED_ENTITY_INIT);
  }
  return color;
}

export function createVector3Zero() {
  const v = Vector3.Zero();
  if (unitializedCheck(v)) {
    throw new Error(Errors.FAILED_ENTITY_INIT);
  }
  return v;
}

export function createTransformNode(name: string, scene: Scene) {
  const node = new TransformNode(name, scene);
  if (unitializedCheck(node)) {
    throw new Error(Errors.FAILED_ENTITY_INIT);
  }
  return node;
}

export function createHavokPlugin(useDeltaWorldStep: boolean, hkInstance: any) {
  const havokPlugin = new HavokPlugin(useDeltaWorldStep, hkInstance);
  if (unitializedCheck(havokPlugin)) {
    throw new Error(Errors.FAILED_ENTITY_INIT);
  }
  return havokPlugin;
}

function unitializedCheck(entity: any) {
  if (!entity || typeof entity === 'undefined') {
    return true;
  }
  return false;
}
/* v8 ignore stop */
