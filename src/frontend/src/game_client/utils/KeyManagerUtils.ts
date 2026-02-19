import { Player } from '../components/player';

export function checkUpperY(yMove: number, player: Player) {
  return (
    player.mesh.absolutePosition.y + yMove >=
    player.goalPosition.y +
      player.goalDimensions.y / 2 -
      player.goalDimensions.y / player.ratioDiv / 2
  );
}

export function checkUpperX(xMove: number, player: Player) {
  return (
    player.mesh.absolutePosition.x + xMove >=
    player.goalPosition.x +
      player.goalDimensions.x / 2 -
      player.goalDimensions.x / player.ratioDiv / 2
  );
}

export function checkLowerY(yMove: number, player: Player) {
  return (
    player.mesh.absolutePosition.y + yMove <=
    player.goalPosition.y -
      player.goalDimensions.y / 2 +
      player.goalDimensions.y / player.ratioDiv / 2
  );
}

export function checkLowerX(xMove: number, player: Player) {
  return (
    player.mesh.absolutePosition.x + xMove <=
    player.goalPosition.x -
      player.goalDimensions.x / 2 +
      player.goalDimensions.x / player.ratioDiv / 2
  );
}
