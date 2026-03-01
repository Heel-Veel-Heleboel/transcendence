import { Match } from '../../generated/prisma/index.js';
import { MatchDao } from '../dao/match.js';
import {
  PlayerMatchResultMessage,
  MatchHistoryEntry,
  MatchHistory,
  GameMode
} from '../types/match.js';
import { Logger } from '../types/logger.js';

/**
 * HTTP client interface for calling User Management service
 * Can be mocked for testing
 */
export interface UserManagementClient {
  reportMatchResult(message: PlayerMatchResultMessage): Promise<void>;
}

/**
 * MatchReporting
 *
 * Responsibilities:
 * 1. Report match results to User Management service (win/loss stats)
 * 2. Build match history for players
 */
export class MatchReporting {
  constructor(
    private readonly matchDao: MatchDao,
    private readonly userManagementClient: UserManagementClient,
    private readonly logger?: Logger
  ) {}

  /**
   * Report match result to User Management service
   * Sends two messages: one for winner (W), one for loser (L)
   *
   * Only reports for:
   * - COMPLETED matches (all types)
   * - FORFEITED/TIMEOUT tournament matches (affects standings)
   *
   * Does NOT report for:
   * - FORFEITED/TIMEOUT casual matches (never actually played)
   */
  async reportMatchResult(match: Match): Promise<void> {
    // Don't report casual forfeits/timeouts
    if (!match.tournamentId && (match.status === 'FORFEITED' || match.status === 'TIMEOUT')) {
      this.log('info', `Skipping result report for casual ${match.status} match ${match.id}`);
      return;
    }

    // Need a winner to report (except for double-forfeit in tournament)
    if (!match.winnerId && match.status === 'COMPLETED') {
      this.log('warn', `Match ${match.id} completed without winner - skipping report`);
      return;
    }

    const player1Id = match.player1Id;
    const player2Id = match.player2Id;

    // Determine results
    let player1Result: boolean;
    let player2Result: boolean;

    if (match.winnerId === player1Id) {
      player1Result = true;
      player2Result = false;
    } else if (match.winnerId === player2Id) {
      player1Result = false;
      player2Result = true;
    } else {
      // Double forfeit in tournament - both lose
      player1Result = false;
      player2Result = false;
    }

    // Send results to User Management
    try {
      await Promise.all([
        this.userManagementClient.reportMatchResult({
          playerId: player1Id,
          isWinner: player1Result
        }),
        this.userManagementClient.reportMatchResult({
          playerId: player2Id,
          isWinner: player2Result
        })
      ]);

      this.log('info', `Reported match ${match.id} results to User Management`, {
        player1: { id: player1Id, isWinner: player1Result },
        player2: { id: player2Id, isWinner: player2Result }
      });
    } catch (error) {
      this.log('error', `Failed to report match ${match.id} results`, { error });
      throw error;
    }
  }

  /**
   * Get match history for a player
   *
   * Includes:
   * - All COMPLETED matches
   * - FORFEITED/TIMEOUT tournament matches
   *
   * Excludes:
   * - FORFEITED/TIMEOUT casual matches
   * - Pending/in-progress matches
   */
  async getMatchHistory(playerId: number, limit?: number): Promise<MatchHistory> {
    // Get all completed matches for this player
    const matches = await this.matchDao.findByPlayerId(playerId);

    // Filter and transform matches
    const historyEntries: MatchHistoryEntry[] = [];

    for (const match of matches) {
      // Skip non-finished matches
      if (!['COMPLETED', 'FORFEITED', 'TIMEOUT'].includes(match.status)) {
        continue;
      }

      // Skip casual forfeits/timeouts
      if (!match.tournamentId && (match.status === 'FORFEITED' || match.status === 'TIMEOUT')) {
        continue;
      }

      // Skip matches without completion time
      if (!match.completedAt) {
        continue;
      }

      // Determine if this player is player1 or player2
      const isPlayer1 = match.player1Id === playerId;
      const opponentId = isPlayer1 ? match.player2Id : match.player1Id;
      const opponentUsername = isPlayer1 ? match.player2Username : match.player1Username;
      const userScore = isPlayer1 ? (match.player1Score ?? 0) : (match.player2Score ?? 0);
      const opponentScore = isPlayer1 ? (match.player2Score ?? 0) : (match.player1Score ?? 0);

      // Determine result
      let isWinner: boolean;
      if (match.winnerId === playerId) {
        isWinner = true;
      } else {
        isWinner = false;
      }

      historyEntries.push({
        matchId: match.id,
        opponentId,
        opponentUsername,
        isWinner,
        userScore,
        opponentScore,
        gameMode: match.gameMode as GameMode,
        tournamentId: match.tournamentId,
        completedAt: match.completedAt
      });
    }

    // Sort by completedAt descending (most recent first)
    historyEntries.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());

    // Apply limit if specified
    if (limit && limit > 0) {
      return historyEntries.slice(0, limit);
    }

    return historyEntries;
  }

  /**
   * Simple logging wrapper
   */
  private log(
    level: 'info' | 'warn' | 'error',
    message: string,
    meta?: Record<string, unknown>
  ): void {
    if (this.logger) {
      this.logger[level]({ ...meta, service: 'match-reporting' }, message);
    } else {
      console.log(`[${level.toUpperCase()}] ${message}`, meta || '');
    }
  }
}
