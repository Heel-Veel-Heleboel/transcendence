import { Vector3 } from '@babylonjs/core';
import { IKeyGrid } from '../types/types';
import { checkDuplicateInString } from '../utils/parse';

export class KeyGrid implements IKeyGrid {
  public grid: Map<string, { x: number; y: number }>;
  public columns: string;
  public rows: string;
  public precisionKeys: string;
  public length: number;
  public ratioDiv: number;
  public dimensions: { goalPosition: Vector3; goalDimensions: Vector3 };

  constructor(
    keys: {
      columns: string;
      rows: string;
      length: number;
      precisionKeys: string;
    },
    dimensions: { goalPosition: Vector3; goalDimensions: Vector3 }
  ) {
    if (keys.columns.length !== keys.rows.length) {
      throw Error('columns and rows not of same length');
    }
    if (
      keys.columns.length !== keys.length ||
      keys.rows.length !== keys.length
    ) {
      throw Error('keys.length not equal to keys.columns or keys.rows');
    }
    checkDuplicateInString(keys.columns + keys.rows);
    this.grid = new Map();
    this.columns = keys.columns;
    this.rows = keys.rows;
    this.precisionKeys = keys.precisionKeys;
    this.length = keys.length;
    this.ratioDiv = this.length;
    this.dimensions = dimensions;

    for (let y = 0; y < this.length; y++) {
      for (let x = 0; x < this.length; x++) {
        this.grid.set(this.columns.charAt(x) + '+' + this.rows.charAt(y), {
          x: this.calculateX(x),
          y: this.calculateY(y)
        });
      }
    }
  }

  private calculateX(x: number): number {
    const startPos =
      this.dimensions.goalPosition.x - this.dimensions.goalDimensions.x / 2;
    const posIndex = (this.dimensions.goalDimensions.x / this.ratioDiv) * x;
    const posOffset = this.dimensions.goalDimensions.x / this.ratioDiv / 2;
    return startPos + posIndex + posOffset;
  }
  private calculateY(y: number): number {
    const startPos =
      this.dimensions.goalPosition.y + this.dimensions.goalDimensions.y / 2;
    const posIndex = (this.dimensions.goalDimensions.y / this.ratioDiv) * y;
    const posOffset = this.dimensions.goalDimensions.y / this.ratioDiv / 2;
    return startPos - posIndex - posOffset;
  }
}
