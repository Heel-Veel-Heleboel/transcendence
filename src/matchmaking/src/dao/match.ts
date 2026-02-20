import { PrismaClient, Match, MatchStatus } from '../../generated/prisma/index.js';
import {
  MatchStatusUpdateData,
  MatchAcknowledgementUpdateData
} from '../types/match.js';

/**
 * Data Access Object for Match
 * Handles all database operations for matches
 */
export class MatchDao {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create a new match
   * All matches start with PENDING_ACKNOWLEDGEMENT status
   * deadline: time window for players to acknowledge AND complete match
   */
  async create(data: {
    player1Id: number;
    player2Id: number;
    player1Username: string;
    player2Username: string;
    gameMode?: string;
    tournamentId?: number | null;
    deadline?: Date | null;
    isGoldenGame?: boolean;
  }): Promise<Match> {
    return await this.prisma.match.create({
      data: {
        player1Id: data.player1Id,
        player2Id: data.player2Id,
        player1Username: data.player1Username,
        player2Username: data.player2Username,
        gameMode: data.gameMode ?? 'classic',
        tournamentId: data.tournamentId ?? null,
        deadline: data.deadline ?? null,
        isGoldenGame: data.isGoldenGame ?? false,
        status: 'PENDING_ACKNOWLEDGEMENT',
        scheduledAt: new Date()
      }
    });
  }

  /**
   * Find a match by ID
   */
  async findById(matchId: string): Promise<Match | null> {
    return await this.prisma.match.findUnique({
      where: { id: matchId }
    });
  }

  /**
   * Find matches by player ID
   */
  async findByPlayerId(playerId: number): Promise<Match[]> {
    return await this.prisma.match.findMany({
      where: {
        OR: [{ player1Id: playerId }, { player2Id: playerId }]
      },
      orderBy: { scheduledAt: 'desc' }
    });
  }

  /**
   * Find matches by tournament ID
   */
  async findByTournamentId(tournamentId: number): Promise<Match[]> {
    return await this.prisma.match.findMany({
      where: { tournamentId },
      orderBy: { scheduledAt: 'asc' }
    });
  }

  /**
   * Find matches by status
   */
  async findByStatus(status: MatchStatus): Promise<Match[]> {
    return await this.prisma.match.findMany({
      where: { status },
      orderBy: { scheduledAt: 'asc' }
    });
  }

  /**
   * Find matches with expired acknowledgement deadline
   * Returns matches in PENDING_ACKNOWLEDGEMENT status past their deadline
   */
  async findUnacknowledged(): Promise<Match[]> {
    const now = new Date();
    return await this.prisma.match.findMany({
      where: {
        deadline: { lt: now },
        status: 'PENDING_ACKNOWLEDGEMENT'
      }
    });
  }

  /**
   * Find overdue matches (past deadline and never started)
   * Only SCHEDULED matches are considered overdue - IN_PROGRESS games are allowed to finish
   */
  async findOverdue(): Promise<Match[]> {
    const now = new Date();
    return await this.prisma.match.findMany({
      where: {
        deadline: { lt: now },
        status: 'SCHEDULED'
      }
    });
  }

  /**
   * Update match status
   */
  async updateStatus(matchId: string, status: MatchStatus): Promise<Match> {
    const updateData: MatchStatusUpdateData = { status };

    if (status === 'IN_PROGRESS') {
      updateData.startedAt = new Date();
    } else if (status === 'COMPLETED' || status === 'FORFEITED' || status === 'TIMEOUT') {
      updateData.completedAt = new Date();
    }

    return await this.prisma.match.update({
      where: { id: matchId },
      data: updateData
    });
  }

  /**
   * Record match result
   */
  async recordResult(
    matchId: string,
    result: {
      winnerId: number | null;
      player1Score: number;
      player2Score: number;
      resultSource: string;
    }
  ): Promise<Match> {
    return await this.prisma.match.update({
      where: { id: matchId },
      data: {
        winnerId: result.winnerId,
        player1Score: result.player1Score,
        player2Score: result.player2Score,
        resultSource: result.resultSource,
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });
  }

  /**
   * Record player acknowledgement
   * Returns updated match. If both players have now acknowledged, status becomes SCHEDULED
   */
  async recordAcknowledgement(matchId: string, playerId: number): Promise<Match> {
    const match = await this.findById(matchId);
    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }

    const isPlayer1 = match.player1Id === playerId;
    const isPlayer2 = match.player2Id === playerId;

    if (!isPlayer1 && !isPlayer2) {
      throw new Error(`Player ${playerId} is not part of match ${matchId}`);
    }

    const updateData: MatchAcknowledgementUpdateData = {
      player1Acknowledged: isPlayer1 ? true : match.player1Acknowledged,
      player2Acknowledged: isPlayer2 ? true : match.player2Acknowledged
    };

    // If both players have now acknowledged, transition to SCHEDULED
    const bothAcknowledged =
      (isPlayer1 || match.player1Acknowledged) &&
      (isPlayer2 || match.player2Acknowledged);

    if (bothAcknowledged) {
      updateData.status = 'SCHEDULED';
    }

    return await this.prisma.match.update({
      where: { id: matchId },
      data: updateData
    });
  }

  /**
   * Handle acknowledgement forfeit scenarios when deadline expires
   * - Both ACKed: No action (match can proceed)
   * - One ACKed: ACKed player wins 7-0
   * - Neither ACKed: Both lose, both get -7 score differential
   */
  async handleAckForfeit(matchId: string): Promise<Match> {
    const match = await this.findById(matchId);
    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }

    const p1Acked = match.player1Acknowledged;
    const p2Acked = match.player2Acknowledged;

    // Case 1: Both acknowledged - no forfeit needed
    if (p1Acked && p2Acked) {
      return match;
    }

    // Case 2: One acknowledged - ACKed player wins 7-0
    if (p1Acked && !p2Acked) {
      return await this.prisma.match.update({
        where: { id: matchId },
        data: {
          status: 'FORFEITED',
          winnerId: match.player1Id,
          player1Score: 7,
          player2Score: 0,
          resultSource: 'ack_forfeit:player2_no_ack',
          completedAt: new Date()
        }
      });
    }

    if (!p1Acked && p2Acked) {
      return await this.prisma.match.update({
        where: { id: matchId },
        data: {
          status: 'FORFEITED',
          winnerId: match.player2Id,
          player1Score: 0,
          player2Score: 7,
          resultSource: 'ack_forfeit:player1_no_ack',
          completedAt: new Date()
        }
      });
    }

    // Case 3: Neither acknowledged - both lose, no winner
    return await this.prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'FORFEITED',
        winnerId: null,
        player1Score: 0,
        player2Score: 0,
        resultSource: 'ack_forfeit:both_no_ack',
        completedAt: new Date()
      }
    });
  }

  /**
   * Set game session ID
   */
  async setGameSessionId(matchId: string, gameSessionId: string): Promise<Match> {
    return await this.prisma.match.update({
      where: { id: matchId },
      data: { gameSessionId }
    });
  }

  /**
   * Delete a match
   */
  async delete(matchId: string): Promise<void> {
    await this.prisma.match.delete({
      where: { id: matchId }
    });
  }

  /**
   * Count matches by status
   */
  async countByStatus(status: MatchStatus): Promise<number> {
    return await this.prisma.match.count({
      where: { status }
    });
  }

  /**
   * Find matches between specific players in a tournament (for head-to-head)
   */
  async findBetweenPlayers(
    tournamentId: number,
    playerIds: number[]
  ): Promise<Match[]> {
    return await this.prisma.match.findMany({
      where: {
        tournamentId,
        AND: [
          { player1Id: { in: playerIds } },
          { player2Id: { in: playerIds } }
        ],
        status: 'COMPLETED'
      }
    });
  }

  /**
   * Convenience method: Acknowledge (alias for recordAcknowledgement)
   */
  async acknowledge(matchId: string, playerId: number): Promise<Match> {
    return await this.recordAcknowledgement(matchId, playerId);
  }

  /**
   * Convenience method: Complete match with all details
   */
  async completeMatch(
    matchId: string,
    result: {
      winnerId: number;
      player1Score: number;
      player2Score: number;
      gameSessionId?: string;
      resultSource: string;
    }
  ): Promise<Match> {
    return await this.prisma.match.update({
      where: { id: matchId },
      data: {
        winnerId: result.winnerId,
        player1Score: result.player1Score,
        player2Score: result.player2Score,
        gameSessionId: result.gameSessionId ?? null,
        resultSource: result.resultSource,
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });
  }

  /**
   * Find active match for a user (PENDING_ACKNOWLEDGEMENT, SCHEDULED, or IN_PROGRESS)
   */
  async findActiveMatchForUser(userId: number): Promise<Match | null> {
    return await this.prisma.match.findFirst({
      where: {
        OR: [{ player1Id: userId }, { player2Id: userId }],
        status: {
          in: ['PENDING_ACKNOWLEDGEMENT', 'SCHEDULED', 'IN_PROGRESS']
        }
      },
      orderBy: { scheduledAt: 'desc' }
    });
  }

  /**
   * Find pending matches with deadlines (for lifecycle recovery)
   * Returns matches in PENDING_ACKNOWLEDGEMENT or SCHEDULED status that have deadlines
   */
  async findPendingWithDeadline(): Promise<Match[]> {
    return await this.prisma.match.findMany({
      where: {
        status: {
          in: ['PENDING_ACKNOWLEDGEMENT', 'SCHEDULED']
        },
        deadline: { not: null }
      },
      orderBy: { deadline: 'asc' }
    });
  }

  /**
   * Generic update method for match fields
   */
  async update(
    matchId: string,
    data: {
      status?: MatchStatus;
      winnerId?: number | null;
      player1Score?: number;
      player2Score?: number;
      completedAt?: Date;
      resultSource?: string;
    }
  ): Promise<Match> {
    return await this.prisma.match.update({
      where: { id: matchId },
      data
    });
  }
}
