import type { MatchStatus as PrismaMatchStatus } from '../../generated/prisma/index.js';

/**
 * Type definitions for Match DAO operations
 */

/**
 * Match status values - mirrors Prisma schema
 *
 * Exposed as a value object so tests and routes can use
 * `MatchStatus.SCHEDULED`-style access without importing
 * the Prisma client directly.
 *
 * The associated `MatchStatus` type is an alias of the
 * Prisma-generated enum type, so everything stays in sync.
 */
export const MatchStatus = {
  PENDING_ACKNOWLEDGEMENT: 'PENDING_ACKNOWLEDGEMENT' as PrismaMatchStatus,
  SCHEDULED: 'SCHEDULED' as PrismaMatchStatus,
  IN_PROGRESS: 'IN_PROGRESS' as PrismaMatchStatus,
  COMPLETED: 'COMPLETED' as PrismaMatchStatus,
  FORFEITED: 'FORFEITED' as PrismaMatchStatus,
  TIMEOUT: 'TIMEOUT' as PrismaMatchStatus
} as const;

export type MatchStatus = PrismaMatchStatus;

/**
 * Supported game modes for matchmaking
 * Add new modes here as they're implemented
 */
export type GameMode = 'classic' | 'powerup';

/**
 * All available game modes
 */
export const GAME_MODES: readonly GameMode[] = ['classic', 'powerup'] as const;

/**
 * Validate if a string is a valid game mode
 */
export function isValidGameMode(mode: string): mode is GameMode {
  return GAME_MODES.includes(mode as GameMode);
}

/**
 * Data structure for updating match status
 * Used in MatchDao.updateStatus()
 */
export interface MatchStatusUpdateData {
  status: MatchStatus;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * Data structure for recording player acknowledgement
 * Used in MatchDao.recordAcknowledgement()
 */
export interface MatchAcknowledgementUpdateData {
  player1Acknowledged: boolean;
  player2Acknowledged: boolean;
  status?: MatchStatus;
}

/**
 * Input data for creating a new match
 */
export interface CreateMatchData {
  player1Id: number;
  player2Id: number;
  player1Username: string;
  player2Username: string;
  gameMode?: GameMode;
  tournamentId?: number | null;
  deadline?: Date | null;
  isGoldenGame?: boolean;
}

/**
 * Input data for recording match result
 */
export interface RecordMatchResultData {
  winnerId: number | null;
  player1Score: number;
  player2Score: number;
  resultSource: string;
}

/**
 * Input data for completing a match with all details
 */
export interface CompleteMatchData {
  winnerId: number;
  player1Score: number;
  player2Score: number;
  gameSessionId?: string;
  resultSource: string;
}

// ============================================================================
// Inter-Service Messaging Types
// ============================================================================

/**
 * Match result for a single player
 * Sent to User Management service after match completes
 */
export type MatchResult = 'W' | 'L';

/**
 * Message sent to User Management service to update player stats
 * One message per player (2 messages per match)
 */
export interface PlayerMatchResultMessage {
  playerId: number;
  result: MatchResult;
}

/**
 * Single match entry in player's match history
 * Used when building the full history list for a player
 *
 * Note: Casual matches that were forfeited/timed out are NOT included in history
 * (they were never actually played). Tournament forfeits ARE included (affect standings).
 */
export interface MatchHistoryEntry {
  matchId: string;
  opponentId: number;           // For linking to opponent's profile
  opponentUsername: string;     // Snapshot at time of match (for display)
  result: MatchResult;
  userScore: number;
  opponentScore: number;
  gameMode: GameMode;
  tournamentId: number | null;  // null = casual match, number = tournament match
  completedAt: Date;
}

/**
 * Full match history for a player
 * Returned by GET /api/matchmaking/players/:userId/history
 */
export type MatchHistory = MatchHistoryEntry[];

/**
 * Player pool entry
 * Used in PlayerPool
 */
export interface PlayerPoolEntry {
  userId: number;
  username: string;
  joinedAt: Date;
  lastActive: Date;
}