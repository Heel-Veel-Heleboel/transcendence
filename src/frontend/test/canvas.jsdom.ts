import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  engineResize,
  initializeResolution,
  prepareImportGLTF
} from '../src/game_client/utils/canvas';
import { NullEngine, Scene, MeshBuilder } from '@babylonjs/core';

describe('keyGridUtils', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('engineResize', () => {
    const engine = new NullEngine();
    const spy = vi.spyOn(engine, 'resize');

    engineResize(engine)();

    expect(spy).toHaveBeenCalled();
  });

  it('initializeResolution', () => {
    const engine = new NullEngine();
    const spy = vi.spyOn(global, 'setTimeout');

    initializeResolution(engine);
    expect(spy).toHaveBeenCalled();
  });

  it('prepareImportGLTF', () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const mesh = MeshBuilder.CreateBox('__root__');
    const spy = vi.spyOn(mesh, 'setParent');

    prepareImportGLTF(scene);
    const root = scene.getMeshByName('__root__');
    if (root) {
      expect(root.position.y).toEqual(4);
      expect(root.parent?.name).toEqual('tr');
      expect(spy).toHaveBeenCalled();
    }
  });
});
