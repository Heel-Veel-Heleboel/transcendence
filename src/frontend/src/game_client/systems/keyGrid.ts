import {
  IKeyGrid,
  IKeyGridConfig,
  IKeyGridDimensions,
  IKeyGridKeys
} from '../types/types';
import {
  checkRowColumnLength,
  checkRowColumnVersusKeyLength,
  checkDuplicateInString,
  checkLength,
  checkNull
} from '../utils/keyGridUtils';

export class KeyGrid implements IKeyGrid {
  public grid: Map<string, { x: number; y: number }>;
  public columns: string;
  public rows: string;
  public precisionKeys: string;
  public length: number;
  public ratioDiv: number;
  public rotation: boolean;
  public dimensions: IKeyGridDimensions;

  constructor(config: IKeyGridConfig) {
    this.checkParameters(config.keys, config.dimensions);
    this.grid = new Map();
    this.columns = config.keys.columns;
    this.rows = config.keys.rows;
    this.precisionKeys = config.keys.precisionKeys;
    this.length = config.keys.length;
    this.ratioDiv = this.length;
    this.dimensions = config.dimensions;
    this.rotation = config.rotation;

    for (let y = 0; y < this.length; y++) {
      for (let x = 0; x < this.length; x++) {
        this.grid.set(this.columns.charAt(x) + '+' + this.rows.charAt(y), {
          x: this.calculateX(x),
          y: this.calculateY(y)
        });
      }
    }
  }

  private checkParameters(keys: IKeyGridKeys, dimensions: IKeyGridDimensions) {
    checkNull(keys, dimensions);
    checkRowColumnLength(keys.columns.length, keys.rows.length);
    checkRowColumnVersusKeyLength(
      keys.columns.length,
      keys.rows.length,
      keys.length
    );
    checkDuplicateInString(keys.columns + keys.rows);
    checkLength(keys.length);
  }

  private calculateX(x: number): number {
    const startPos = this.rotation
      ? this.dimensions.goalPosition.x + this.dimensions.goalDimensions.x / 2
      : this.dimensions.goalPosition.x - this.dimensions.goalDimensions.x / 2;
    const posIndex = (this.dimensions.goalDimensions.x / this.ratioDiv) * x;
    const posOffset = this.dimensions.goalDimensions.x / this.ratioDiv / 2;
    return this.rotation
      ? startPos - posIndex - posOffset
      : startPos + posIndex + posOffset;
  }
  private calculateY(y: number): number {
    const startPos =
      this.dimensions.goalPosition.y + this.dimensions.goalDimensions.y / 2;
    const posIndex = (this.dimensions.goalDimensions.y / this.ratioDiv) * y;
    const posOffset = this.dimensions.goalDimensions.y / this.ratioDiv / 2;
    return startPos - posIndex - posOffset;
  }
}
