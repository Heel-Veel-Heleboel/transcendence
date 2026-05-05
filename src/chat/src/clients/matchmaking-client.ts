export class MatchmakingClient {
  constructor(private readonly matchmakingUrl: string) {}

  async acknowledge(
    matchId: string,
    playerId: number
  ): Promise<{ bothReady: boolean; roomId: string | null }> {
    const response = await fetch(
      `${this.matchmakingUrl}/matchmaking/match/${matchId}/acknowledge`,
      {
        method: 'POST',
        headers: { 'x-user-id': String(playerId) }
      }
    );

    if (!response.ok) {
      throw new Error(`Matchmaking returned ${response.status} when acknowledging match ${matchId}`);
    }

    return (await response.json()) as { bothReady: boolean; roomId: string | null };
  }

  async decline(matchId: string, playerId: number): Promise<void> {
    const response = await fetch(
      `${this.matchmakingUrl}/matchmaking/match/${matchId}/decline`,
      {
        method: 'POST',
        headers: { 'x-user-id': String(playerId) }
      }
    );

    if (!response.ok) {
      throw new Error(`Matchmaking returned ${response.status} when declining match ${matchId}`);
    }
  }
}
