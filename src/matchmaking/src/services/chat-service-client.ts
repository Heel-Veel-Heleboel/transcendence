import { Logger } from '../types/logger.js';

/**
 * ChatServiceClient
 *
 * Handles server-to-server communication with the chat service.
 * Used by matchmaking to:
 *   1. Notify both players via a system message when a match is found (match-ack)
 *   2. Create a shared game session channel after both players have acknowledged
 */
export class ChatServiceClient {
  constructor(
    private readonly chatServiceUrl: string,
    private readonly logger?: Logger
  ) {}

  /**
   * Send a match acknowledgement notification to both players via the chat service.
   * Creates a temporary system channel for each player and posts a system message
   * prompting them to acknowledge readiness.
   *
   * Called immediately after a match is created (before players ACK).
   */
  async sendMatchAck(
    matchId: string,
    playerIds: number[],
    gameMode: string,
    expiresAt: Date
  ): Promise<void> {
    const response = await fetch(`${this.chatServiceUrl}/chat/internal/match-ack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchId,
        playerIds,
        gameMode,
        expiresAt: expiresAt.toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Chat service responded ${response.status} when sending match-ack for match ${matchId}`);
    }

    this.log('info', `Sent match-ack for match ${matchId} to players ${playerIds.join(', ')}`);
  }

  /**
   * Create a shared game session channel for both players in the chat service.
   * Called after both players have acknowledged and the Colyseus room is provisioned.
   *
   * @param playerIds   - IDs of both players who will be members of the channel
   * @param gameSessionId - The Colyseus room ID (also used as the channel identifier)
   */
  async createGameSessionChannel(
    playerIds: number[],
    gameSessionId: string
  ): Promise<void> {
    const response = await fetch(`${this.chatServiceUrl}/chat/internal/channels/game-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerIds, gameSessionId })
    });

    if (!response.ok) {
      throw new Error(`Chat service responded ${response.status} when creating game session channel for ${gameSessionId}`);
    }

    this.log('info', `Created game session channel for session ${gameSessionId}, players ${playerIds.join(', ')}`);
  }

  private log(level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>): void {
    if (this.logger) {
      this.logger[level]({ ...meta, service: 'chat-service-client' }, message);
    } else {
      console.log(`[${level.toUpperCase()}] ${message}`, meta || '');
    }
  }
}
