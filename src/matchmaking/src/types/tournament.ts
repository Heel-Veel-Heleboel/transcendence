import { TournamentStatus, MatchStatus } from '../../generated/prisma/index.js';

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
export const DEFAULT_REGISTRATION_DURATION_MIN = 2;

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
  creatorUsername: string;
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

/**
 * A single node in the bracket binary tree array.
 * TBD nodes represent future/unplayed match slots that don't exist in the DB yet.
 */
export interface BracketNode {
  player1Id: number | null;
  player1Username: string;
  player2Id: number | null;
  player2Username: string;
  winnerId: number | null;
  status: MatchStatus | 'TBD';
}

/**
 * Bracket representation for a knockout tournament.
 *
 * The `bracket` array is a binary tree stored in level-order (BFS):
 *   - index 0 = root = the final match
 *   - children of node i are at 2i+1 (left) and 2i+2 (right)
 *   - total size = 2^totalRounds - 1
 *
 * Nodes whose matches don't exist yet have status "TBD" and null player fields.
 * The frontend can infer the full bracket shape from totalRounds alone.
 */
export interface TournamentBracket {
  tournamentId: number;
  totalRounds: number;
  status: TournamentStatus;
  bracket: BracketNode[];
}
