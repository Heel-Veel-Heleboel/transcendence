import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  checkLowerX,
  checkLowerY,
  checkUpperX,
  checkUpperY
} from '../../src/frontend/src/game/utils/KeyManagerUtils';

const Player = vi.fn();
Player.prototype.movePrecise = vi.fn(
  (args: { x: number; y: number }) => `${args.x}, and ${args.y}`
);
Player.prototype.move = vi.fn((coords: string) => coords);
Player.prototype.keyGrid = vi.fn();
Player.prototype.keyGrid.grid = new Map([['q+a', { x: 0, y: 0 }]]);
Player.prototype.keyGrid.precisionKeys = 'WASD';
Player.prototype.goalDimensions = vi.fn();
Player.prototype.goalDimensions.x = 20;
Player.prototype.goalDimensions.y = 20;
Player.prototype.goalPosition = vi.fn();
Player.prototype.goalPosition.x = 0;
Player.prototype.goalPosition.y = 0;
Player.prototype.ratioDiv = 4;
Player.prototype.physicsMesh = vi.fn();
Player.prototype.physicsMesh.aggregate = vi.fn();
Player.prototype.physicsMesh.aggregate.transformNode = vi.fn();
Player.prototype.physicsMesh.aggregate.transformNode.absolutePosition = vi.fn();
Player.prototype.physicsMesh.aggregate.transformNode.absolutePosition.x = 5;
Player.prototype.physicsMesh.aggregate.transformNode.absolutePosition.y = 5;

describe('KeyManagerUtils', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('checkUpperY - equal upperY', async () => {
    const player = new Player();
    const arg =
      player.goalPosition.y +
      player.goalDimensions.y / 2 -
      player.goalDimensions.y / player.ratioDiv / 2 -
      player.physicsMesh.aggregate.transformNode.absolutePosition.y;

    const result = checkUpperY(arg, player);

    expect(result).toEqual(true);
  });

  it('checkUpperY - over upperY', async () => {
    const player = new Player();
    const arg =
      player.goalPosition.y +
      player.goalDimensions.y / 2 -
      player.goalDimensions.y / player.ratioDiv / 2 -
      player.physicsMesh.aggregate.transformNode.absolutePosition.y +
      0.01;

    const result = checkUpperY(arg, player);

    expect(result).toEqual(true);
  });

  it('checkUpperY - under upperY', async () => {
    const player = new Player();
    const arg =
      player.goalPosition.y +
      player.goalDimensions.y / 2 -
      player.goalDimensions.y / player.ratioDiv / 2 -
      player.physicsMesh.aggregate.transformNode.absolutePosition.y -
      0.01;

    const result = checkUpperY(arg, player);

    expect(result).toEqual(false);
  });

  it('checkUpperX - equal upperX', async () => {
    const player = new Player();
    const arg =
      player.goalPosition.x +
      player.goalDimensions.x / 2 -
      player.goalDimensions.x / player.ratioDiv / 2 -
      player.physicsMesh.aggregate.transformNode.absolutePosition.x;

    const result = checkUpperX(arg, player);

    expect(result).toEqual(true);
  });

  it('checkUpperX - over upperX', async () => {
    const player = new Player();
    const arg =
      player.goalPosition.x +
      player.goalDimensions.x / 2 -
      player.goalDimensions.x / player.ratioDiv / 2 -
      player.physicsMesh.aggregate.transformNode.absolutePosition.x +
      0.01;

    const result = checkUpperX(arg, player);

    expect(result).toEqual(true);
  });

  it('checkUpperX - under upperX', async () => {
    const player = new Player();
    const arg =
      player.goalPosition.x +
      player.goalDimensions.x / 2 -
      player.goalDimensions.x / player.ratioDiv / 2 -
      player.physicsMesh.aggregate.transformNode.absolutePosition.x -
      0.01;

    const result = checkUpperX(arg, player);

    expect(result).toEqual(false);
  });

  it('checkLowerY - equal lowerY', async () => {
    const player = new Player();
    const arg =
      player.goalPosition.y -
      player.goalDimensions.y / 2 +
      player.goalDimensions.y / player.ratioDiv / 2 -
      player.physicsMesh.aggregate.transformNode.absolutePosition.y;

    const result = checkLowerY(arg, player);

    expect(result).toEqual(true);
  });

  it('checkLowerY - over lowerY', async () => {
    const player = new Player();
    const arg =
      player.goalPosition.y -
      player.goalDimensions.y / 2 +
      player.goalDimensions.y / player.ratioDiv / 2 -
      player.physicsMesh.aggregate.transformNode.absolutePosition.y -
      0.01;

    const result = checkLowerY(arg, player);

    expect(result).toEqual(true);
  });

  it('checkLowerY - under lowerY', async () => {
    const player = new Player();
    const arg =
      player.goalPosition.y -
      player.goalDimensions.y / 2 +
      player.goalDimensions.y / player.ratioDiv / 2 -
      player.physicsMesh.aggregate.transformNode.absolutePosition.y +
      0.01;

    const result = checkLowerY(arg, player);

    expect(result).toEqual(false);
  });

  it('checkLowerX - equal lowerX', async () => {
    const player = new Player();
    const arg =
      player.goalPosition.x -
      player.goalDimensions.x / 2 +
      player.goalDimensions.x / player.ratioDiv / 2 -
      player.physicsMesh.aggregate.transformNode.absolutePosition.x;

    const result = checkLowerX(arg, player);

    expect(result).toEqual(true);
  });

  it('checkLowerX - over lowerX', async () => {
    const player = new Player();
    const arg =
      player.goalPosition.x -
      player.goalDimensions.x / 2 +
      player.goalDimensions.x / player.ratioDiv / 2 -
      player.physicsMesh.aggregate.transformNode.absolutePosition.x -
      0.01;

    const result = checkLowerX(arg, player);

    expect(result).toEqual(true);
  });

  it('checkLowerX - under lowerX', async () => {
    const player = new Player();
    const arg =
      player.goalPosition.x -
      player.goalDimensions.x / 2 +
      player.goalDimensions.x / player.ratioDiv / 2 -
      player.physicsMesh.aggregate.transformNode.absolutePosition.x +
      0.01;

    const result = checkLowerX(arg, player);

    expect(result).toEqual(false);
  });
});
