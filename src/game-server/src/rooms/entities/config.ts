import { PhysicsMesh } from '#types/physics.js';

export function getHostConfig(goal1: PhysicsMesh) {
  return {
    keys: {
      columns: 'asdf',
      rows: 'hjkl',
      length: 4,
      precisionKeys: 'ArrowUp;ArrowDown;ArrowLeft;ArrowRight'
    },
    goalPosition: goal1.mesh.absolutePosition,
    goalDimensions: goal1.mesh
      .getBoundingInfo()
      .boundingBox.extendSizeWorld.scale(2),
    isHost: true
  };
}

export function getGuestConfig(goal2: PhysicsMesh) {
  return {
    keys: {
      columns: 'asdf',
      rows: 'hjkl',
      length: 4,
      precisionKeys: 'ArrowUp;ArrowDown;ArrowLeft;ArrowRight'
    },
    goalPosition: goal2.mesh.absolutePosition,
    goalDimensions: goal2.mesh
      .getBoundingInfo()
      .boundingBox.extendSizeWorld.scale(2),
    isHost: false
  };
}
