import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  checkNull,
  checkRowColumnLength,
  checkRowColumnVersusKeyLength,
  checkDuplicateInString,
  checkLength
} from '../src/game_client/utils/keyGridUtils';
import { Vector3 } from '@babylonjs/core';
import Errors from '../src/game_client/utils/error';
import gameConfig from '../src/game_client/utils/gameConfig';

describe('keyGridUtils', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('checkNull - keys.columns', async () => {
    const keys = { columns: '', rows: 'a', length: 1, precisionKeys: 's' };
    const dimensions = {
      goalPosition: new Vector3(1, 1, 1),
      goalDimensions: new Vector3(1, 1, 1)
    };

    expect(() => {
      checkNull(keys, dimensions);
    }).toThrowError(Errors.INVALID_KEYGRID_CONFIG);
  });

  it('checkNull - keys.rows', async () => {
    const keys = { columns: 'a', rows: '', length: 1, precisionKeys: 's' };
    const dimensions = {
      goalPosition: new Vector3(1, 1, 1),
      goalDimensions: new Vector3(1, 1, 1)
    };

    expect(() => {
      checkNull(keys, dimensions);
    }).toThrowError(Errors.INVALID_KEYGRID_CONFIG);
  });

  it('checkNull - keys.precisionKeys', async () => {
    const keys = { columns: 'a', rows: 'b', length: 1, precisionKeys: '' };
    const dimensions = {
      goalPosition: new Vector3(1, 1, 1),
      goalDimensions: new Vector3(1, 1, 1)
    };

    expect(() => {
      checkNull(keys, dimensions);
    }).toThrowError(Errors.INVALID_KEYGRID_CONFIG);
  });

  it('checkNull - keys.length', async () => {
    const keys = { columns: 'a', rows: 'b', length: 0, precisionKeys: 's' };
    const dimensions = {
      goalPosition: new Vector3(1, 1, 1),
      goalDimensions: new Vector3(1, 1, 1)
    };

    expect(() => {
      checkNull(keys, dimensions);
    }).toThrowError(Errors.INVALID_KEYGRID_CONFIG);
  });

  it('checkNull - dimensions.goalDimensions', async () => {
    const keys = { columns: 'a', rows: 'b', length: 1, precisionKeys: 's' };
    const dimensions = {
      goalPosition: new Vector3(1, 1, 1),
      goalDimensions: Vector3.Zero()
    };

    expect(() => {
      checkNull(keys, dimensions);
    }).toThrowError(Errors.INVALID_KEYGRID_CONFIG);
  });

  it('checkRowColumnLength - unequal', async () => {
    const columnsLength = 1;
    const rowsLength = 0;
    expect(() => {
      checkRowColumnLength(columnsLength, rowsLength);
    }).toThrowError(Errors.INVALID_MATRIX_LENGTH);
  });

  it('checkRowColumnLength - equal', async () => {
    const columnsLength = 1;
    const rowsLength = 1;
    expect(() => {
      checkRowColumnLength(columnsLength, rowsLength);
    }).not.toThrowError();
  });

  it('checkRowColumnVersusKeyLength - equal', async () => {
    const columnsLength = 1;
    const rowsLength = 1;
    const keysLength = 1;
    expect(() => {
      checkRowColumnVersusKeyLength(columnsLength, rowsLength, keysLength);
    }).not.toThrowError();
  });

  it('checkRowColumnVersusKeyLength - column unequal', async () => {
    const columnsLength = 0;
    const rowsLength = 1;
    const keysLength = 1;
    expect(() => {
      checkRowColumnVersusKeyLength(columnsLength, rowsLength, keysLength);
    }).toThrowError(Errors.INVALID_KEYS_LENGTH);
  });

  it('checkRowColumnVersusKeyLength - row unequal', async () => {
    const columnsLength = 1;
    const rowsLength = 0;
    const keysLength = 1;
    expect(() => {
      checkRowColumnVersusKeyLength(columnsLength, rowsLength, keysLength);
    }).toThrowError(Errors.INVALID_KEYS_LENGTH);
  });

  it('checkRowColumnVersusKeyLength - keys unequal', async () => {
    const columnsLength = 1;
    const rowsLength = 1;
    const keysLength = 2;
    expect(() => {
      checkRowColumnVersusKeyLength(columnsLength, rowsLength, keysLength);
    }).toThrowError(Errors.INVALID_KEYS_LENGTH);
  });

  it('checkDuplicateInString - duplicate', async () => {
    const str = 'qq';
    expect(() => {
      checkDuplicateInString(str);
    }).toThrowError(Errors.DUPLICATE_KEY_VALUES);
  });

  it('checkDuplicateInString - no duplicate', async () => {
    const str = 'qa';
    expect(() => {
      checkDuplicateInString(str);
    }).not.toThrowError();
  });

  it('checkLength - under', async () => {
    const length = gameConfig.keyLimit - 1;
    expect(() => {
      checkLength(length);
    }).not.toThrowError();
  });

  it('checkLength - over', async () => {
    const length = gameConfig.keyLimit + 1;
    expect(() => {
      checkLength(length);
    }).toThrowError(Errors.SURPASSING_KEY_LIMIT);
  });

  it('checkLength - equal', async () => {
    const length = gameConfig.keyLimit;
    expect(() => {
      checkLength(length);
    }).not.toThrowError();
  });
});
