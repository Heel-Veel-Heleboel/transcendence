import { Match } from '../../generated/prisma/index.js';
import { Logger } from '../types/logger.js';

/**
 * GameServerClient
 *
 * Handles server-to-server communication with the game server.
 * Called by matchmaking when both players have acknowledged and a
 * Colyseus room needs to be provisioned for them to connect to.
 */
export class GameServerClient {
  constructor(
    private readonly gameServerUrl: string,
    private readonly logger?: Logger
  ) {}

  /**
   * Ask the game server to create a Colyseus room for a matched game.
   * Returns the roomId both players should use with client.joinById(roomId).
   */
  async createRoom(match: Match): Promise<string> {
    const response = await fetch(`${this.gameServerUrl}/api/rooms/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchId: match.id,
        player1Id: match.player1Id,
        player2Id: match.player2Id,
        player1Username: match.player1Username,
        player2Username: match.player2Username,
        gameMode: match.gameMode,
        tournamentId: match.tournamentId,
        deadline: match.deadline?.toISOString() ?? null,
        isGoldenGame: match.isGoldenGame
      })
    });

    if (!response.ok) {
      throw new Error(`Game server responded ${response.status} when creating room for match ${match.id}`);
    }

    const data = await response.json() as { roomId: string };
    this.log('info', `Created game room ${data.roomId} for match ${match.id}`);
    return data.roomId;
  }

  private log(level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>): void {
    if (this.logger) {
      this.logger[level]({ ...meta, service: 'game-server-client' }, message);
    } else {
      console.log(`[${level.toUpperCase()}] ${message}`, meta || '');
    }
  }
}
