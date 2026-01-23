import { describe, it, expect, vi, afterEach } from 'vitest';
import { KeyGrid } from '../../src/frontend/src/game_client/systems/keyGrid.ts';
import { Vector3 } from '@babylonjs/core';
import Errors from '../../src/frontend/src/game_client/utils/error.ts';

describe('KeyGrid - config ', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('null config - columns', async () => {
    const keys = {
      columns: '',
      rows: 'df',
      length: 2,
      precisionKeys: 'WASD'
    };
    const dimensions = {
      goalPosition: new Vector3(0, 0, 0),
      goalDimensions: new Vector3(1, 1, 1)
    };

    expect(() => new KeyGrid(keys, dimensions)).toThrowError(
      Errors.INVALID_KEYGRID_CONFIG
    );
  });

  it('null config - rows', async () => {
    const keys = {
      columns: 'qa',
      rows: '',
      length: 2,
      precisionKeys: 'WASD'
    };
    const dimensions = {
      goalPosition: new Vector3(0, 0, 0),
      goalDimensions: new Vector3(1, 1, 1)
    };

    expect(() => new KeyGrid(keys, dimensions)).toThrowError(
      Errors.INVALID_KEYGRID_CONFIG
    );
  });

  it('null config - length', async () => {
    const keys = {
      columns: 'qa',
      rows: 'df',
      length: 0,
      precisionKeys: 'WASD'
    };
    const dimensions = {
      goalPosition: new Vector3(0, 0, 0),
      goalDimensions: new Vector3(1, 1, 1)
    };

    expect(() => new KeyGrid(keys, dimensions)).toThrowError(
      Errors.INVALID_KEYGRID_CONFIG
    );
  });

  it('null config - precisionKeys', async () => {
    const keys = {
      columns: 'qa',
      rows: 'df',
      length: 2,
      precisionKeys: ''
    };
    const dimensions = {
      goalPosition: new Vector3(0, 0, 0),
      goalDimensions: new Vector3(1, 1, 1)
    };

    expect(() => new KeyGrid(keys, dimensions)).toThrowError(
      Errors.INVALID_KEYGRID_CONFIG
    );
  });

  it('null config - goalDimensions', async () => {
    const keys = {
      columns: 'qa',
      rows: 'df',
      length: 2,
      precisionKeys: 'WASD'
    };
    const dimensions = {
      goalPosition: new Vector3(0, 0, 0),
      goalDimensions: new Vector3(0, 0, 0)
    };

    expect(() => new KeyGrid(keys, dimensions)).toThrowError(
      Errors.INVALID_KEYGRID_CONFIG
    );
  });

  it('inequal length columns', async () => {
    const keys = {
      columns: 'qa',
      rows: 'y',
      length: 2,
      precisionKeys: 'WASD'
    };
    const dimensions = {
      goalPosition: new Vector3(0, 0, 0),
      goalDimensions: new Vector3(1, 1, 1)
    };

    expect(() => new KeyGrid(keys, dimensions)).toThrowError(
      Errors.INVALID_MATRIX_LENGTH
    );
  });

  it('inequal length rows', async () => {
    const keys = {
      columns: 'q',
      rows: 'ya',
      length: 2,
      precisionKeys: 'WASD'
    };
    const dimensions = {
      goalPosition: new Vector3(0, 0, 0),
      goalDimensions: new Vector3(1, 1, 1)
    };

    expect(() => new KeyGrid(keys, dimensions)).toThrowError(
      Errors.INVALID_MATRIX_LENGTH
    );
  });

  it('invalid length versus columns.length / rows.length', async () => {
    const keys = {
      columns: 'qr',
      rows: 'ya',
      length: 1,
      precisionKeys: 'WASD'
    };
    const dimensions = {
      goalPosition: new Vector3(0, 0, 0),
      goalDimensions: new Vector3(1, 1, 1)
    };

    expect(() => new KeyGrid(keys, dimensions)).toThrowError(
      Errors.INVALID_KEYS_LENGTH
    );
  });

  it('duplicate key values - begin', async () => {
    const keys = {
      columns: 'qxr',
      rows: 'qca',
      length: 3,
      precisionKeys: 'WASD'
    };
    const dimensions = {
      goalPosition: new Vector3(0, 0, 0),
      goalDimensions: new Vector3(1, 1, 1)
    };

    expect(() => new KeyGrid(keys, dimensions)).toThrowError(
      Errors.DUPLICATE_KEY_VALUES
    );
  });

  it('duplicate key values - middle', async () => {
    const keys = {
      columns: 'qxr',
      rows: 'zxa',
      length: 3,
      precisionKeys: 'WASD'
    };
    const dimensions = {
      goalPosition: new Vector3(0, 0, 0),
      goalDimensions: new Vector3(1, 1, 1)
    };

    expect(() => new KeyGrid(keys, dimensions)).toThrowError(
      Errors.DUPLICATE_KEY_VALUES
    );
  });

  it('duplicate key values - end', async () => {
    const keys = {
      columns: 'qxr',
      rows: 'zvr',
      length: 3,
      precisionKeys: 'WASD'
    };
    const dimensions = {
      goalPosition: new Vector3(0, 0, 0),
      goalDimensions: new Vector3(1, 1, 1)
    };

    expect(() => new KeyGrid(keys, dimensions)).toThrowError(
      Errors.DUPLICATE_KEY_VALUES
    );
  });

  it('surpassing key limit', async () => {
    const keys = {
      columns: 'qwertyuiopas[=',
      rows: 'dfghlzxcvbnm]+',
      length: 14,
      precisionKeys: 'WASD'
    };
    const dimensions = {
      goalPosition: new Vector3(0, 0, 0),
      goalDimensions: new Vector3(1, 1, 1)
    };

    expect(() => new KeyGrid(keys, dimensions)).toThrowError(
      Errors.SURPASSING_KEY_LIMIT
    );
  });

  it('correct config', async () => {
    const keys = {
      columns: 'qwas',
      rows: 'erdf',
      length: 4,
      precisionKeys: 'WASD'
    };
    const dimensions = {
      goalPosition: new Vector3(0, 0, 0),
      goalDimensions: new Vector3(1, 1, 1)
    };

    const keyGrid = new KeyGrid(keys, dimensions);

    const grid = new Map([
      [
        'a+d',
        {
          x: 0.125,
          y: -0.125
        }
      ],
      [
        'a+e',
        {
          x: 0.125,
          y: 0.375
        }
      ],
      [
        'a+f',
        {
          x: 0.125,
          y: -0.375
        }
      ],
      [
        'a+r',
        {
          x: 0.125,
          y: 0.125
        }
      ],
      [
        'q+d',
        {
          x: -0.375,
          y: -0.125
        }
      ],
      [
        'q+e',
        {
          x: -0.375,
          y: 0.375
        }
      ],
      [
        'q+f',
        {
          x: -0.375,
          y: -0.375
        }
      ],
      [
        'q+r',
        {
          x: -0.375,
          y: 0.125
        }
      ],
      [
        's+d',
        {
          x: 0.375,
          y: -0.125
        }
      ],
      [
        's+e',
        {
          x: 0.375,
          y: 0.375
        }
      ],
      [
        's+f',
        {
          x: 0.375,
          y: -0.375
        }
      ],
      [
        's+r',
        {
          x: 0.375,
          y: 0.125
        }
      ],
      [
        'w+d',
        {
          x: -0.125,
          y: -0.125
        }
      ],
      [
        'w+e',
        {
          x: -0.125,
          y: 0.375
        }
      ],
      [
        'w+f',
        {
          x: -0.125,
          y: -0.375
        }
      ],
      [
        'w+r',
        {
          x: -0.125,
          y: 0.125
        }
      ]
    ]);
    expect(keyGrid.grid).toEqual(grid);
    expect(keyGrid.columns).toEqual(keys.columns);
    expect(keyGrid.rows).toEqual(keys.rows);
    expect(keyGrid.precisionKeys).toEqual(keys.precisionKeys);
    expect(keyGrid.length).toEqual(4);
    expect(keyGrid.ratioDiv).toEqual(4);
    expect(keyGrid.dimensions).toEqual(dimensions);
  });

  describe('KeyGrid - Grid ', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('4 keys - 2 x 2', async () => {
      const keys = {
        columns: 'qwas',
        rows: 'erdf',
        length: 4,
        precisionKeys: 'WASD'
      };
      const dimensions = {
        goalPosition: new Vector3(0, 0, 0),
        goalDimensions: new Vector3(2, 2, 1)
      };

      const keyGrid = new KeyGrid(keys, dimensions);

      const grid = new Map([
        [
          'a+d',
          {
            x: 0.25,
            y: -0.25
          }
        ],
        [
          'a+e',
          {
            x: 0.25,
            y: 0.75
          }
        ],
        [
          'a+f',
          {
            x: 0.25,
            y: -0.75
          }
        ],
        [
          'a+r',
          {
            x: 0.25,
            y: 0.25
          }
        ],
        [
          'q+d',
          {
            x: -0.75,
            y: -0.25
          }
        ],
        [
          'q+e',
          {
            x: -0.75,
            y: 0.75
          }
        ],
        [
          'q+f',
          {
            x: -0.75,
            y: -0.75
          }
        ],
        [
          'q+r',
          {
            x: -0.75,
            y: 0.25
          }
        ],
        [
          's+d',
          {
            x: 0.75,
            y: -0.25
          }
        ],
        [
          's+e',
          {
            x: 0.75,
            y: 0.75
          }
        ],
        [
          's+f',
          {
            x: 0.75,
            y: -0.75
          }
        ],
        [
          's+r',
          {
            x: 0.75,
            y: 0.25
          }
        ],
        [
          'w+d',
          {
            x: -0.25,
            y: -0.25
          }
        ],
        [
          'w+e',
          {
            x: -0.25,
            y: 0.75
          }
        ],
        [
          'w+f',
          {
            x: -0.25,
            y: -0.75
          }
        ],
        [
          'w+r',
          {
            x: -0.25,
            y: 0.25
          }
        ]
      ]);
      expect(keyGrid.grid).toEqual(grid);
    });

    it('4 keys - 4 x 4', async () => {
      const keys = {
        columns: 'qwas',
        rows: 'erdf',
        length: 4,
        precisionKeys: 'WASD'
      };
      const dimensions = {
        goalPosition: new Vector3(0, 0, 0),
        goalDimensions: new Vector3(4, 4, 1)
      };

      const keyGrid = new KeyGrid(keys, dimensions);

      const grid = new Map([
        [
          'a+d',
          {
            x: 0.5,
            y: -0.5
          }
        ],
        [
          'a+e',
          {
            x: 0.5,
            y: 1.5
          }
        ],
        [
          'a+f',
          {
            x: 0.5,
            y: -1.5
          }
        ],
        [
          'a+r',
          {
            x: 0.5,
            y: 0.5
          }
        ],
        [
          'q+d',
          {
            x: -1.5,
            y: -0.5
          }
        ],
        [
          'q+e',
          {
            x: -1.5,
            y: 1.5
          }
        ],
        [
          'q+f',
          {
            x: -1.5,
            y: -1.5
          }
        ],
        [
          'q+r',
          {
            x: -1.5,
            y: 0.5
          }
        ],
        [
          's+d',
          {
            x: 1.5,
            y: -0.5
          }
        ],
        [
          's+e',
          {
            x: 1.5,
            y: 1.5
          }
        ],
        [
          's+f',
          {
            x: 1.5,
            y: -1.5
          }
        ],
        [
          's+r',
          {
            x: 1.5,
            y: 0.5
          }
        ],
        [
          'w+d',
          {
            x: -0.5,
            y: -0.5
          }
        ],
        [
          'w+e',
          {
            x: -0.5,
            y: 1.5
          }
        ],
        [
          'w+f',
          {
            x: -0.5,
            y: -1.5
          }
        ],
        [
          'w+r',
          {
            x: -0.5,
            y: 0.5
          }
        ]
      ]);
      expect(keyGrid.grid).toEqual(grid);
    });

    it('6 keys - 3 x 3', async () => {
      const keys = {
        columns: 'qwaszx',
        rows: 'erdfcv',
        length: 6,
        precisionKeys: 'WASD'
      };
      const dimensions = {
        goalPosition: new Vector3(0, 0, 0),
        goalDimensions: new Vector3(3, 3, 1)
      };

      const keyGrid = new KeyGrid(keys, dimensions);

      const grid = new Map([
        [
          'a+c',
          {
            x: -0.25,
            y: -0.75
          }
        ],
        [
          'a+d',
          {
            x: -0.25,
            y: 0.25
          }
        ],
        [
          'a+e',
          {
            x: -0.25,
            y: 1.25
          }
        ],
        [
          'a+f',
          {
            x: -0.25,
            y: -0.25
          }
        ],
        [
          'a+r',
          {
            x: -0.25,
            y: 0.75
          }
        ],
        [
          'a+v',
          {
            x: -0.25,
            y: -1.25
          }
        ],
        [
          'q+c',
          {
            x: -1.25,
            y: -0.75
          }
        ],
        [
          'q+d',
          {
            x: -1.25,
            y: 0.25
          }
        ],
        [
          'q+e',
          {
            x: -1.25,
            y: 1.25
          }
        ],
        [
          'q+f',
          {
            x: -1.25,
            y: -0.25
          }
        ],
        [
          'q+r',
          {
            x: -1.25,
            y: 0.75
          }
        ],
        [
          'q+v',
          {
            x: -1.25,
            y: -1.25
          }
        ],
        [
          's+c',
          {
            x: 0.25,
            y: -0.75
          }
        ],
        [
          's+d',
          {
            x: 0.25,
            y: 0.25
          }
        ],
        [
          's+e',
          {
            x: 0.25,
            y: 1.25
          }
        ],
        [
          's+f',
          {
            x: 0.25,
            y: -0.25
          }
        ],
        [
          's+r',
          {
            x: 0.25,
            y: 0.75
          }
        ],
        [
          's+v',
          {
            x: 0.25,
            y: -1.25
          }
        ],
        [
          'w+c',
          {
            x: -0.75,
            y: -0.75
          }
        ],
        [
          'w+d',
          {
            x: -0.75,
            y: 0.25
          }
        ],
        [
          'w+e',
          {
            x: -0.75,
            y: 1.25
          }
        ],
        [
          'w+f',
          {
            x: -0.75,
            y: -0.25
          }
        ],
        [
          'w+r',
          {
            x: -0.75,
            y: 0.75
          }
        ],
        [
          'w+v',
          {
            x: -0.75,
            y: -1.25
          }
        ],
        [
          'x+c',
          {
            x: 1.25,
            y: -0.75
          }
        ],
        [
          'x+d',
          {
            x: 1.25,
            y: 0.25
          }
        ],
        [
          'x+e',
          {
            x: 1.25,
            y: 1.25
          }
        ],
        [
          'x+f',
          {
            x: 1.25,
            y: -0.25
          }
        ],
        [
          'x+r',
          {
            x: 1.25,
            y: 0.75
          }
        ],
        [
          'x+v',
          {
            x: 1.25,
            y: -1.25
          }
        ],
        [
          'z+c',
          {
            x: 0.75,
            y: -0.75
          }
        ],
        [
          'z+d',
          {
            x: 0.75,
            y: 0.25
          }
        ],
        [
          'z+e',
          {
            x: 0.75,
            y: 1.25
          }
        ],
        [
          'z+f',
          {
            x: 0.75,
            y: -0.25
          }
        ],
        [
          'z+r',
          {
            x: 0.75,
            y: 0.75
          }
        ],
        [
          'z+v',
          {
            x: 0.75,
            y: -1.25
          }
        ]
      ]);
      expect(keyGrid.grid).toEqual(grid);
    });

    it('6 keys - 4 x 4', async () => {
      const keys = {
        columns: 'qwaszx',
        rows: 'erdfcv',
        length: 6,
        precisionKeys: 'WASD'
      };
      const dimensions = {
        goalPosition: new Vector3(0, 0, 0),
        goalDimensions: new Vector3(6, 6, 1)
      };

      const keyGrid = new KeyGrid(keys, dimensions);

      const grid = new Map([
        [
          'a+c',
          {
            x: -0.5,
            y: -1.5
          }
        ],
        [
          'a+d',
          {
            x: -0.5,
            y: 0.5
          }
        ],
        [
          'a+e',
          {
            x: -0.5,
            y: 2.5
          }
        ],
        [
          'a+f',
          {
            x: -0.5,
            y: -0.5
          }
        ],
        [
          'a+r',
          {
            x: -0.5,
            y: 1.5
          }
        ],
        [
          'a+v',
          {
            x: -0.5,
            y: -2.5
          }
        ],
        [
          'q+c',
          {
            x: -2.5,
            y: -1.5
          }
        ],
        [
          'q+d',
          {
            x: -2.5,
            y: 0.5
          }
        ],
        [
          'q+e',
          {
            x: -2.5,
            y: 2.5
          }
        ],
        [
          'q+f',
          {
            x: -2.5,
            y: -0.5
          }
        ],
        [
          'q+r',
          {
            x: -2.5,
            y: 1.5
          }
        ],
        [
          'q+v',
          {
            x: -2.5,
            y: -2.5
          }
        ],
        [
          's+c',
          {
            x: 0.5,
            y: -1.5
          }
        ],
        [
          's+d',
          {
            x: 0.5,
            y: 0.5
          }
        ],
        [
          's+e',
          {
            x: 0.5,
            y: 2.5
          }
        ],
        [
          's+f',
          {
            x: 0.5,
            y: -0.5
          }
        ],
        [
          's+r',
          {
            x: 0.5,
            y: 1.5
          }
        ],
        [
          's+v',
          {
            x: 0.5,
            y: -2.5
          }
        ],
        [
          'w+c',
          {
            x: -1.5,
            y: -1.5
          }
        ],
        [
          'w+d',
          {
            x: -1.5,
            y: 0.5
          }
        ],
        [
          'w+e',
          {
            x: -1.5,
            y: 2.5
          }
        ],
        [
          'w+f',
          {
            x: -1.5,
            y: -0.5
          }
        ],
        [
          'w+r',
          {
            x: -1.5,
            y: 1.5
          }
        ],
        [
          'w+v',
          {
            x: -1.5,
            y: -2.5
          }
        ],
        [
          'x+c',
          {
            x: 2.5,
            y: -1.5
          }
        ],
        [
          'x+d',
          {
            x: 2.5,
            y: 0.5
          }
        ],
        [
          'x+e',
          {
            x: 2.5,
            y: 2.5
          }
        ],
        [
          'x+f',
          {
            x: 2.5,
            y: -0.5
          }
        ],
        [
          'x+r',
          {
            x: 2.5,
            y: 1.5
          }
        ],
        [
          'x+v',
          {
            x: 2.5,
            y: -2.5
          }
        ],
        [
          'z+c',
          {
            x: 1.5,
            y: -1.5
          }
        ],
        [
          'z+d',
          {
            x: 1.5,
            y: 0.5
          }
        ],
        [
          'z+e',
          {
            x: 1.5,
            y: 2.5
          }
        ],
        [
          'z+f',
          {
            x: 1.5,
            y: -0.5
          }
        ],
        [
          'z+r',
          {
            x: 1.5,
            y: 1.5
          }
        ],
        [
          'z+v',
          {
            x: 1.5,
            y: -2.5
          }
        ]
      ]);
      expect(keyGrid.grid).toEqual(grid);
    });
  });
});
