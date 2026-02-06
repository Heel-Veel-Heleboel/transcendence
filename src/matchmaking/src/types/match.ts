import { MatchStatus } from '../../generated/prisma/index.js';

/**
 * Type definitions for Match DAO operations
 */

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
