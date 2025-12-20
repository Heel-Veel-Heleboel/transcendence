import { IKeyGrid } from './types';

export class KeyGrid implements IKeyGrid {
  public grid: Map<string, { x: number; y: number }>;
  public columns: string;
  public rows: string;
  public length: number;

  constructor(columns: string, rows: string) {
    if (columns.length !== rows.length) {
      throw Error('columns and rows not of same length');
    }
    this.grid = new Map();
    this.columns = columns;
    this.rows = rows;
    this.length = columns.length;

    for (let y = 0; y < this.length; y++) {
      for (let x = 0; x < this.length; x++) {
        this.grid.set(columns.charAt(y) + rows.charAt(x), { x, y });
      }
    }
  }
}
