import type { FastifyBaseLogger } from 'fastify';

export class ChatServiceClient {
  constructor(
    private readonly chatServiceUrl: string,
    private readonly logger?: FastifyBaseLogger
  ) {}

  async sendMatchAck(
    matchId: string,
    playerIds: number[],
    gameMode: string,
    expiresAt: Date,
    tournament?: { id: number; name: string },
    challengerUsername?: string
  ): Promise<void> {
    const response = await fetch(`${this.chatServiceUrl}/chat/internal/match-ack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchId,
        playerIds,
        gameMode,
        expiresAt: expiresAt.toISOString(),
        ...(tournament && { tournamentId: tournament.id, tournamentName: tournament.name }),
        ...(challengerUsername && { challengerUsername })
      })
    });

    if (!response.ok) {
      throw new Error(`Chat service responded ${response.status} when sending match-ack for match ${matchId}`);
    }

    this.log('info', `Sent match-ack for match ${matchId} to players ${playerIds.join(', ')}`);
  }

  private log(level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>): void {
    if (this.logger) {
      this.logger[level]({ ...meta, service: 'chat-service-client' }, message);
    } else {
      console.log(`[${level.toUpperCase()}] ${message}`, meta || '');
    }
  }
}
