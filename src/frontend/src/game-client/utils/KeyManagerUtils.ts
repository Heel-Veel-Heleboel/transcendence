import { Protagonist } from '../components/Protagonist';

/* v8 ignore start */
export function checkUp(yMove: number, player: Protagonist) {
  return (
    player.mesh.absolutePosition.y + yMove >=
    player.goalPosition.y +
      player.goalDimensions.y / 2 -
      player.goalDimensions.y / player.ratioDiv / 2
  );
}
export function checkRight(xMove: number, player: Protagonist) {
  const leftOp = player.mesh.absolutePosition.x + xMove;
  const op =
    player.goalDimensions.x / 2 - player.goalDimensions.x / player.ratioDiv / 2;
  const rightOp = player.rotation
    ? player.goalPosition.x - op
    : player.goalPosition.x + op;
  const condition = player.rotation ? leftOp <= rightOp : leftOp >= rightOp;
  return condition;
}

export function checkDown(yMove: number, player: Protagonist) {
  return (
    player.mesh.absolutePosition.y + yMove <=
    player.goalPosition.y -
      player.goalDimensions.y / 2 +
      player.goalDimensions.y / player.ratioDiv / 2
  );
}

export function checkLeft(xMove: number, player: Protagonist) {
  const leftOp = player.mesh.absolutePosition.x + xMove;
  const op =
    player.goalDimensions.x / 2 - player.goalDimensions.x / player.ratioDiv / 2;
  const rightOp = player.rotation
    ? player.goalPosition.x + op
    : player.goalPosition.x - op;
  const condition = player.rotation ? leftOp >= rightOp : leftOp <= rightOp;
  return condition;
}
/* v8 ignore stop */
