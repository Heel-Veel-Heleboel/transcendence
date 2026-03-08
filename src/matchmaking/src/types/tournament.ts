import { TournamentStatus } from '../../generated/prisma/index.js';

/**
 * Type definitions for Tournament operations
 */

/**
 * Tournament configuration defaults
 *
 * These are applied by the backend when a user creates a tournament.
 * The client only needs to provide a name and game mode.
 */
export const DEFAULT_MIN_PLAYERS = 2;
export const DEFAULT_MAX_PLAYERS = 16;
export const DEFAULT_MATCH_DURATION_MIN = 3;
export const DEFAULT_ACK_DEADLINE_MIN = 20;

/**
 * Registration window in minutes from the time the tournament
 * creation request is received.
 */
export const DEFAULT_REGISTRATION_DURATION_MIN = 60;

/**
 * Input data for creating a tournament
 */
export interface CreateTournamentData {
  name: string;
  gameMode?: string;
  minPlayers?: number;
  maxPlayers?: number;
  matchDurationMin?: number;
  ackDeadlineMin?: number;
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
  totalRounds?: number;
}

/**
 * Tournament with participant count (for listings)
 */
export interface TournamentSummary {
  id: number;
  name: string;
  gameMode: string;
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
 * Participant standing in a knockout tournament
 */
export interface TournamentRanking {
  rank: number;
  userId: number;
  username: string;
  seed: number | null;
  eliminatedIn: number | null;  // null = still in or winner
}
