import { PrismaClient, Tournament, TournamentStatus } from '../../generated/prisma/index.js';
import {
  CreateTournamentData,
  UpdateTournamentData,
  TournamentSummary,
  DEFAULT_MAX_PLAYERS,
  DEFAULT_MIN_PLAYERS,
  DEFAULT_MATCH_DURATION_MIN,
  DEFAULT_ACK_DEADLINE_MIN
} from '../types/tournament.js';

/**
 * Data Access Object for Tournament
 * Handles all database operations for tournaments
 */
export class TournamentDao {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create a new tournament
   */
  async create(data: CreateTournamentData): Promise<Tournament> {
    return await this.prisma.tournament.create({
      data: {
        name: data.name,
        gameMode: data.gameMode ?? 'classic',
        minPlayers: data.minPlayers ?? DEFAULT_MIN_PLAYERS,
        maxPlayers: data.maxPlayers ?? DEFAULT_MAX_PLAYERS,
        matchDurationMin: data.matchDurationMin ?? DEFAULT_MATCH_DURATION_MIN,
        ackDeadlineMin: data.ackDeadlineMin ?? DEFAULT_ACK_DEADLINE_MIN,
        createdBy: data.createdBy,
        registrationEnd: data.registrationEnd,
        startTime: data.startTime ?? null,
        status: 'REGISTRATION'
      }
    });
  }

  /**
   * Find a tournament by ID
   */
  async findById(tournamentId: number): Promise<Tournament | null> {
    return await this.prisma.tournament.findUnique({
      where: { id: tournamentId }
    });
  }

  /**
   * Find a tournament by ID with participant count
   */
  async findByIdWithParticipantCount(tournamentId: number): Promise<TournamentSummary | null> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        _count: {
          select: { participants: true }
        }
      }
    });

    if (!tournament) {
      return null;
    }

    return {
      id: tournament.id,
      name: tournament.name,
      gameMode: tournament.gameMode,
      status: tournament.status,
      minPlayers: tournament.minPlayers,
      maxPlayers: tournament.maxPlayers,
      participantCount: tournament._count.participants,
      registrationEnd: tournament.registrationEnd,
      startTime: tournament.startTime,
      createdBy: tournament.createdBy,
      createdAt: tournament.createdAt
    };
  }

  /**
   * Find tournaments by status
   */
  async findByStatus(status: TournamentStatus): Promise<Tournament[]> {
    return await this.prisma.tournament.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Find tournaments created by a specific user
   */
  async findByCreator(userId: number): Promise<Tournament[]> {
    return await this.prisma.tournament.findMany({
      where: { createdBy: userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Find tournaments with registration ending soon
   * Used by scheduler to transition tournaments
   */
  async findRegistrationEnding(before: Date): Promise<Tournament[]> {
    return await this.prisma.tournament.findMany({
      where: {
        status: 'REGISTRATION',
        registrationEnd: { lte: before }
      },
      orderBy: { registrationEnd: 'asc' }
    });
  }

  /**
   * Find tournaments ready to start
   * (SCHEDULED status and startTime has passed)
   */
  async findReadyToStart(now: Date): Promise<Tournament[]> {
    return await this.prisma.tournament.findMany({
      where: {
        status: 'SCHEDULED',
        startTime: { lte: now }
      },
      orderBy: { startTime: 'asc' }
    });
  }

  /**
   * Find open tournaments (accepting registrations)
   */
  async findOpen(): Promise<TournamentSummary[]> {
    const tournaments = await this.prisma.tournament.findMany({
      where: {
        status: 'REGISTRATION',
        registrationEnd: { gt: new Date() }
      },
      include: {
        _count: {
          select: { participants: true }
        }
      },
      orderBy: { registrationEnd: 'asc' }
    });

    return tournaments.map(t => ({
      id: t.id,
      name: t.name,
      gameMode: t.gameMode,
      status: t.status,
      minPlayers: t.minPlayers,
      maxPlayers: t.maxPlayers,
      participantCount: t._count.participants,
      registrationEnd: t.registrationEnd,
      startTime: t.startTime,
      createdBy: t.createdBy,
      createdAt: t.createdAt
    }));
  }

  /**
   * Update tournament
   */
  async update(tournamentId: number, data: UpdateTournamentData): Promise<Tournament> {
    return await this.prisma.tournament.update({
      where: { id: tournamentId },
      data
    });
  }

  /**
   * Update tournament status
   */
  async updateStatus(tournamentId: number, status: TournamentStatus): Promise<Tournament> {
    const updateData: UpdateTournamentData = { status };

    if (status === 'COMPLETED' || status === 'CANCELLED') {
      updateData.endTime = new Date();
    }

    return await this.prisma.tournament.update({
      where: { id: tournamentId },
      data: updateData
    });
  }

  /**
   * Delete a tournament
   * Note: Cascade deletes participants and matches
   */
  async delete(tournamentId: number): Promise<void> {
    await this.prisma.tournament.delete({
      where: { id: tournamentId }
    });
  }

  /**
   * Check if a user has created an active tournament
   * (REGISTRATION, SCHEDULED, or IN_PROGRESS)
   */
  async hasActiveCreatedTournament(userId: number): Promise<boolean> {
    const count = await this.prisma.tournament.count({
      where: {
        createdBy: userId,
        status: { in: ['REGISTRATION', 'SCHEDULED', 'IN_PROGRESS'] }
      }
    });
    return count > 0;
  }

  /**
   * Count tournaments by status
   */
  async countByStatus(status: TournamentStatus): Promise<number> {
    return await this.prisma.tournament.count({
      where: { status }
    });
  }

  /**
   * Get participant count for a tournament
   */
  async getParticipantCount(tournamentId: number): Promise<number> {
    return await this.prisma.tournamentParticipant.count({
      where: { tournamentId }
    });
  }

  /**
   * Check if tournament has room for more participants
   * Uses single query to fetch tournament and participant count
   */
  async hasCapacity(tournamentId: number): Promise<boolean> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        _count: {
          select: { participants: true }
        }
      }
    });

    if (!tournament) {
      return false;
    }

    return tournament._count.participants < tournament.maxPlayers;
  }

  /**
   * Check if tournament has minimum players to start
   * Uses single query to fetch tournament and participant count
   */
  async hasMinimumPlayers(tournamentId: number): Promise<boolean> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        _count: {
          select: { participants: true }
        }
      }
    });

    if (!tournament) {
      return false;
    }

    return tournament._count.participants >= tournament.minPlayers;
  }
}
