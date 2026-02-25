import { TournamentStatus } from '../../generated/prisma/index.js';

/**
 * Type definitions for Tournament operations
 */

/**
 * Tournament format types
 */
export type TournamentFormat = 'round_robin' | 'single_elimination';

/**
 * Tie-breaker cascade (applied in order):
 * 1. wins - most wins
 * 2. score_diff - sum of (own_score - opponent_score) across all matches
 * 3. head_to_head - score diff in matches between tied players only
 * 4. golden_game - schedule an extra match between tied players
 */

/**
 * Input data for creating a tournament
 */
export interface CreateTournamentData {
  name: string;
  format?: TournamentFormat;
  minPlayers?: number;
  maxPlayers?: number;
  matchDeadlineMin?: number;
  createdBy: number;
  registrationEnd: Date;
  startTime?: Date | null;
}

/**
 * Input data for updating a tournament
 */
export interface UpdateTournamentData {
  name?: string;
  status?: TournamentStatus;
  registrationEnd?: Date;
  startTime?: Date | null;
  endTime?: Date | null;
}

/**
 * Tournament with participant count (for listings)
 */
export interface TournamentSummary {
  id: number;
  name: string;
  format: string;
  status: TournamentStatus;
  minPlayers: number;
  maxPlayers: number;
  participantCount: number;
  registrationEnd: Date;
  startTime: Date | null;
  createdBy: number;
  createdAt: Date;
}

/**
 * Participant ranking in a tournament
 */
export interface TournamentRanking {
  rank: number;
  userId: number;
  wins: number;
  losses: number;
  scoreDiff: number;
  matchesPlayed: number;
}

/**
 * Tournament leaderboard
 */
export type TournamentLeaderboard = TournamentRanking[];
