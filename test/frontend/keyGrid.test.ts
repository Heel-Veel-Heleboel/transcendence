import { describe, it, expect, vi, afterEach } from 'vitest';
import { KeyGrid } from '../../src/frontend/src/game/systems/keyGrid.ts';
import { Vector3 } from '@babylonjs/core';

describe('KeyGrid Class', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('null keys', async () => {
    const keys = {
      columns: '',
      rows: '',
      length: 0,
      precisionKeys: ''
    };
    const dimensions = {
      goalPosition: new Vector3(0, 0, 0),
      goalDimensions: new Vector3(0, 0, 0)
    };

    const keyGrid = new KeyGrid(keys, dimensions);

    const grid = new Map();
    expect(keyGrid.grid).toEqual(grid);
    expect(keyGrid.columns).toEqual('');
    expect(keyGrid.rows).toEqual('');
    expect(keyGrid.precisionKeys).toEqual('');
    expect(keyGrid.length).toEqual(0);
    expect(keyGrid.ratioDiv).toEqual(0);
    expect(keyGrid.dimensions).toEqual(dimensions);
  });

  it('inequal length', async () => {
    const keys = {
      columns: 'qa',
      rows: 'y',
      length: 0,
      precisionKeys: ''
    };
    const dimensions = {
      goalPosition: new Vector3(0, 0, 0),
      goalDimensions: new Vector3(0, 0, 0)
    };

    const keyGrid = new KeyGrid(keys, dimensions);

    const grid = new Map();
    expect(keyGrid.grid).toEqual(grid);
    expect(keyGrid.columns).toEqual('');
    expect(keyGrid.rows).toEqual('');
    expect(keyGrid.precisionKeys).toEqual('');
    expect(keyGrid.length).toEqual(0);
    expect(keyGrid.ratioDiv).toEqual(0);
    expect(keyGrid.dimensions).toEqual(dimensions);
  });
});
