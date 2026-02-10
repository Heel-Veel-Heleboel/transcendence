import { PrismaClient, TournamentParticipant } from '../../generated/prisma/index.js';
import { TournamentRanking } from '../types/tournament.js';

/**
 * Data Access Object for TournamentParticipant
 * Handles all database operations for tournament registrations
 */
export class TournamentParticipantDao {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Register a player for a tournament
   */
  async register(tournamentId: number, userId: number): Promise<TournamentParticipant> {
    return await this.prisma.tournamentParticipant.create({
      data: {
        tournamentId,
        userId
      }
    });
  }

  /**
   * Unregister a player from a tournament
   */
  async unregister(tournamentId: number, userId: number): Promise<void> {
    await this.prisma.tournamentParticipant.delete({
      where: {
        tournamentId_userId: { tournamentId, userId }
      }
    });
  }

  /**
   * Find a participant by tournament and user
   */
  async findByTournamentAndUser(
    tournamentId: number,
    userId: number
  ): Promise<TournamentParticipant | null> {
    return await this.prisma.tournamentParticipant.findUnique({
      where: {
        tournamentId_userId: { tournamentId, userId }
      }
    });
  }

  /**
   * Check if a user is registered for a tournament
   */
  async isRegistered(tournamentId: number, userId: number): Promise<boolean> {
    const participant = await this.findByTournamentAndUser(tournamentId, userId);
    return participant !== null;
  }

  /**
   * Find all participants for a tournament
   */
  async findByTournament(tournamentId: number): Promise<TournamentParticipant[]> {
    return await this.prisma.tournamentParticipant.findMany({
      where: { tournamentId },
      orderBy: { registeredAt: 'asc' }
    });
  }

  /**
   * Find all tournaments a user is registered for
   */
  async findByUser(userId: number): Promise<TournamentParticipant[]> {
    return await this.prisma.tournamentParticipant.findMany({
      where: { userId },
      orderBy: { registeredAt: 'desc' }
    });
  }

  /**
   * Update participant stats after a match
   */
  async updateStats(
    tournamentId: number,
    userId: number,
    stats: {
      wins?: number;
      losses?: number;
      scoreDiff?: number;
    }
  ): Promise<TournamentParticipant> {
    return await this.prisma.tournamentParticipant.update({
      where: {
        tournamentId_userId: { tournamentId, userId }
      },
      data: stats
    });
  }

  /**
   * Increment wins for a participant
   */
  async incrementWins(
    tournamentId: number,
    userId: number,
    scoreDiff: number
  ): Promise<TournamentParticipant> {
    return await this.prisma.tournamentParticipant.update({
      where: {
        tournamentId_userId: { tournamentId, userId }
      },
      data: {
        wins: { increment: 1 },
        scoreDiff: { increment: scoreDiff }
      }
    });
  }

  /**
   * Increment losses for a participant
   */
  async incrementLosses(
    tournamentId: number,
    userId: number,
    scoreDiff: number
  ): Promise<TournamentParticipant> {
    return await this.prisma.tournamentParticipant.update({
      where: {
        tournamentId_userId: { tournamentId, userId }
      },
      data: {
        losses: { increment: 1 },
        scoreDiff: { increment: scoreDiff }
      }
    });
  }

  /**
   * Set final rank for a participant
   */
  async setFinalRank(
    tournamentId: number,
    userId: number,
    rank: number
  ): Promise<TournamentParticipant> {
    return await this.prisma.tournamentParticipant.update({
      where: {
        tournamentId_userId: { tournamentId, userId }
      },
      data: { finalRank: rank }
    });
  }

  /**
   * Get rankings for a tournament
   * Sorted by: wins DESC, scoreDiff DESC
   */
  async getRankings(tournamentId: number): Promise<TournamentRanking[]> {
    const participants = await this.prisma.tournamentParticipant.findMany({
      where: { tournamentId },
      orderBy: [
        { wins: 'desc' },
        { scoreDiff: 'desc' }
      ]
    });

    return participants.map((p, index) => ({
      rank: index + 1,
      userId: p.userId,
      wins: p.wins,
      losses: p.losses,
      scoreDiff: p.scoreDiff,
      matchesPlayed: p.wins + p.losses
    }));
  }

  /**
   * Get participant count for a tournament
   */
  async count(tournamentId: number): Promise<number> {
    return await this.prisma.tournamentParticipant.count({
      where: { tournamentId }
    });
  }

  /**
   * Get user IDs of all participants in a tournament
   */
  async getParticipantUserIds(tournamentId: number): Promise<number[]> {
    const participants = await this.prisma.tournamentParticipant.findMany({
      where: { tournamentId },
      select: { userId: true }
    });
    return participants.map(p => p.userId);
  }

  /**
   * Find participants with same wins and scoreDiff (for tie-breaking)
   */
  async findTiedParticipants(
    tournamentId: number,
    wins: number,
    scoreDiff: number
  ): Promise<TournamentParticipant[]> {
    return await this.prisma.tournamentParticipant.findMany({
      where: {
        tournamentId,
        wins,
        scoreDiff
      }
    });
  }

  /**
   * Bulk set final ranks for all participants
   */
  async setAllFinalRanks(
    rankings: Array<{ tournamentId: number; userId: number; rank: number }>
  ): Promise<void> {
    await this.prisma.$transaction(
      rankings.map(r =>
        this.prisma.tournamentParticipant.update({
          where: {
            tournamentId_userId: {
              tournamentId: r.tournamentId,
              userId: r.userId
            }
          },
          data: { finalRank: r.rank }
        })
      )
    );
  }
}
