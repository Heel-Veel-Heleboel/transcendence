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
  async register(
    tournamentId: number,
    userId: number,
    username: string
  ): Promise<TournamentParticipant> {
    return await this.prisma.tournamentParticipant.create({
      data: {
        tournamentId,
        userId,
        username
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
   * Get the active tournament a user is participating in, if any.
   * Active = REGISTRATION, SCHEDULED, or IN_PROGRESS.
   * Returns tournament ID and createdBy, or null.
   */
  async getActiveTournament(userId: number): Promise<{ tournamentId: number; createdBy: number; tournamentStatus: string } | null> {
    const participant = await this.prisma.tournamentParticipant.findFirst({
      where: {
        userId,
        eliminatedIn: null,
        tournament: {
          status: { in: ['REGISTRATION', 'SCHEDULED', 'IN_PROGRESS'] }
        }
      },
      select: {
        tournamentId: true,
        tournament: { select: { createdBy: true, status: true } }
      }
    });
    if (!participant) return null;
    return {
      tournamentId: participant.tournamentId,
      createdBy: participant.tournament.createdBy,
      tournamentStatus: participant.tournament.status
    };
  }

  /**
   * Set seed position for a participant (when bracket is generated)
   */
  async setSeed(
    tournamentId: number,
    userId: number,
    seed: number
  ): Promise<TournamentParticipant> {
    return await this.prisma.tournamentParticipant.update({
      where: {
        tournamentId_userId: { tournamentId, userId }
      },
      data: { seed }
    });
  }

  /**
   * Mark a participant as eliminated in a specific round
   */
  async eliminate(
    tournamentId: number,
    userId: number,
    round: number
  ): Promise<TournamentParticipant> {
    return await this.prisma.tournamentParticipant.update({
      where: {
        tournamentId_userId: { tournamentId, userId }
      },
      data: { eliminatedIn: round }
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
   * Get rankings for a knockout tournament.
   * Winner (no eliminatedIn) first, then sorted by round eliminated (later = better).
   */
  async getRankings(tournamentId: number): Promise<TournamentRanking[]> {
    const participants = await this.prisma.tournamentParticipant.findMany({
      where: { tournamentId }
    });

    // Sort: non-eliminated first (still alive / winner), then by round eliminated desc (later = better).
    // If finalRank is set (post-finalization), use it as primary sort.
    const sorted = [...participants].sort((a, b) => {
      if (a.finalRank !== null && b.finalRank !== null) return a.finalRank - b.finalRank;
      if (a.finalRank !== null) return -1;
      if (b.finalRank !== null) return 1;
      if (a.eliminatedIn === null && b.eliminatedIn !== null) return -1;
      if (b.eliminatedIn === null && a.eliminatedIn !== null) return 1;
      if (a.eliminatedIn === null && b.eliminatedIn === null) return 0;
      return (b.eliminatedIn ?? 0) - (a.eliminatedIn ?? 0);
    });

    return sorted.map((p, index) => ({
      rank: p.finalRank ?? index + 1,
      userId: p.userId,
      username: p.username,
      seed: p.seed,
      eliminatedIn: p.eliminatedIn
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
   * Get participants with usernames (for match generation)
   */
  async getParticipantsWithUsernames(
    tournamentId: number
  ): Promise<Array<{ userId: number; username: string }>> {
    return await this.prisma.tournamentParticipant.findMany({
      where: { tournamentId },
      select: { userId: true, username: true },
      orderBy: { registeredAt: 'asc' }
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
