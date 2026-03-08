/**
 * MatchmakingClient
 *
 * Forwards match acknowledgement/decline decisions from the chat service
 * to the matchmaking service so it can create game rooms or cancel matches.
 */
export class MatchmakingClient {
  constructor(private readonly matchmakingUrl: string) {}

  /**
   * Forward a player's acknowledgement to the matchmaking service.
   * Returns the matchmaking response (includes bothReady and roomId when both acked).
   */
  async acknowledge(matchId: string, playerId: number): Promise<{ bothReady: boolean; roomId: string | null }> {
    const response = await fetch(`${this.matchmakingUrl}/match/${matchId}/acknowledge`, {
      method: 'POST',
      headers: {
        'x-user-id': String(playerId)
      }
    });

    if (!response.ok) {
      throw new Error(`Matchmaking returned ${response.status} when acknowledging match ${matchId}`);
    }

    return await response.json() as { bothReady: boolean; roomId: string | null };
  }

  /**
   * Forward a player's decline to the matchmaking service.
   * The match will be cancelled.
   */
  async decline(matchId: string, playerId: number): Promise<void> {
    const response = await fetch(`${this.matchmakingUrl}/match/${matchId}/decline`, {
      method: 'POST',
      headers: {
        'x-user-id': String(playerId)
      }
    });

    if (!response.ok) {
      throw new Error(`Matchmaking returned ${response.status} when declining match ${matchId}`);
    }
  }
}
