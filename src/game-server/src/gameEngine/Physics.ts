import HavokPhysics from '@babylonjs/havok';
import { HavokPlugin, Vector3, Scene } from '@babylonjs/core';
import path from 'node:path';
import fs from 'fs';
import { exit } from 'node:process';

/* v8 ignore start */
export async function initializePhysics(scene: Scene) {
  const wasm = path.join(
    process.cwd(),
    'node_modules/@babylonjs/havok/lib/esm/HavokPhysics.wasm'
  );
  const fileBuffer: Buffer<ArrayBufferLike> = fs.readFileSync(wasm);
  const binary: ArrayBuffer = new Uint8Array(fileBuffer).buffer;
  await HavokPhysics({ wasmBinary: binary }).then(havokInstance => {
    const hk = new HavokPlugin(true, havokInstance);
    const success = scene.enablePhysics(new Vector3(0, 0, 0), hk);
    if (success) {
      console.log('physicsEnabled');
    } else {
      console.log('failed physics');
      exit(1);
    }
    const observable = hk.onCollisionObservable;
    observable.add(collisionEvent => {
      console.log(collisionEvent.collider);
      // Process collisions for the player
      // ...
    });
  });
}
/* v8 ignore stop */
