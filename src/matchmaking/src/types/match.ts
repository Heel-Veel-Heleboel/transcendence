import { MatchStatus } from '../../generated/prisma/index.js';

/**
 * Type definitions for Match DAO operations
 */

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
