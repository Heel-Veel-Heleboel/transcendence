import { IKeyGridDimensions, IKeyGridKeys } from '../types/Types';
import { Vector3 } from '@babylonjs/core';
import gameConfig from './GameConfig';
import Errors from './Error';

/* v8 ignore start */
export function checkNull(keys: IKeyGridKeys, dimensions: IKeyGridDimensions) {
  if (
    !keys.columns ||
    !keys.rows ||
    !keys.precisionKeys ||
    !keys.length ||
    dimensions.goalDimensions.equals(Vector3.Zero())
  ) {
    throw Error(Errors.INVALID_KEYGRID_CONFIG);
  }
}

export function checkRowColumnLength(
  columnsLength: number,
  rowsLength: number
) {
  if (columnsLength !== rowsLength) {
    throw Error(Errors.INVALID_MATRIX_LENGTH);
  }
}

export function checkRowColumnVersusKeyLength(
  columnsLength: number,
  rowsLength: number,
  keysLength: number
) {
  if (columnsLength !== keysLength || rowsLength !== keysLength) {
    throw Error(Errors.INVALID_KEYS_LENGTH);
  }
}

export function checkDuplicateInString(str: string) {
  if (
    str
      .toLowerCase()
      .split('')
      .sort()
      .join('')
      .match(/(.)\1+/g) !== null
  ) {
    throw Error(Errors.DUPLICATE_KEY_VALUES);
  }
}

export function checkLength(length: number) {
  if (length > gameConfig.keyLimit) {
    throw Error(Errors.SURPASSING_KEY_LIMIT);
  }
}
/* v8 ignore stop */
