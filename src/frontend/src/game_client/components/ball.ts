import { IHack, PhysicsMesh } from '../types/types.ts';
import { AbstractMesh, Mesh, Vector3 } from '@babylonjs/core';

/* v8 ignore start */
export class Hack implements IHack {
  public physicsMesh: PhysicsMesh;
  public lifespan!: number;
  public linearVelocity!: Vector3;
  public lines: AbstractMesh | null;
  constructor(mesh: Mesh, position: Vector3) {
    mesh.position = position;
    this.physicsMesh = { mesh };
    this.lines = null;
  }

  isDead(): boolean {
    const dead = this.lifespan < 0.0;
    if (dead) {
      this.dispose();
    }
    return dead;
  }

  dispose(): void {
    this.lifespan = -1;
    this.physicsMesh.mesh.dispose();
    if (this.lines) {
      this.lines.dispose();
    }
  }

  update(): void {
    if (this.isDead()) {
      this.dispose();
    }
  }
}
/* v8 ignore stop */
