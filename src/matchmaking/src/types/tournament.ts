import { TournamentStatus } from '../../generated/prisma/index.js';

/**
 * Type definitions for Tournament operations
 */

/**
 * Tournament format types
 */
export type TournamentFormat = 'single_elimination';

/**
 * Input data for creating a tournament
 */
export interface CreateTournamentData {
  name: string;
  format?: TournamentFormat;
  minPlayers?: number;
  maxPlayers?: number;
  matchDeadlineMin?: number;
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
 * Participant standing in a knockout tournament
 */
export interface TournamentRanking {
  rank: number;
  userId: number;
  username: string;
  seed: number | null;
  eliminatedIn: number | null;  // null = still in or winner
}
