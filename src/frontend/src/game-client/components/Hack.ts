import { IHack } from '../types/Types';
import { AbstractMesh, Mesh, Vector3 } from '@babylonjs/core';

/* v8 ignore start */
export class Hack implements IHack {
  public mesh: AbstractMesh;
  public lifespan!: number;
  public linearVelocity!: Vector3;
  public lines: AbstractMesh | null;
  public hitDisk: AbstractMesh | null;

  constructor(mesh: Mesh, position: Vector3) {
    mesh.position = position;
    this.mesh = mesh;
    this.lines = null;
    this.hitDisk = null;
  }

  isDead(): boolean {
    const dead = this.lifespan < 0.0;
    return dead;
  }

  dispose(): void {
    this.lifespan = -1;
    this.mesh.dispose();
    if (this.lines) {
      this.lines.dispose();
    }
    if (this.hitDisk) {
      this.hitDisk.dispose();
    }
  }

  update(): void {
    if (this.isDead()) {
      this.dispose();
    }
  }
}
/* v8 ignore stop */
