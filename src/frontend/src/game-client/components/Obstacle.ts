import { AbstractMesh, Color4, Mesh, Vector3 } from '@babylonjs/core';
/* v8 ignore start */
export class Obstacle {
  public mesh: AbstractMesh;

  constructor(type: number, mesh: Mesh, position: Vector3) {
    mesh.visibility = 0.41;
    mesh.enableEdgesRendering();
    mesh.edgesWidth = 10.0;
    mesh.position = position;
    mesh.edgesColor = new Color4(1, 1, 1, 1);
    this.mesh = mesh;
  }

  dispose(): void {
    this.mesh.dispose();
  }
}
/* v8 ignore stop */
