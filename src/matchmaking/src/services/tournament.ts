import { Tournament, TournamentStatus, Match } from '../../generated/prisma/index.js';
import { TournamentDao } from '../dao/tournament.js';
import { TournamentParticipantDao } from '../dao/tournament-participant.js';
import { MatchDao } from '../dao/match.js';
import {
  CreateTournamentData,
  TournamentSummary,
  TournamentRanking
} from '../types/tournament.js';
import { Logger } from '../types/logger.js';

/**
 * Error thrown when a tournament operation fails
 */
export class TournamentError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'TournamentError';
  }
}

/**
 * TournamentService
 * Manages single-elimination tournament lifecycle, registration, bracket generation,
 * and winner advancement.
 */
export class TournamentService {
  constructor(
    private readonly tournamentDao: TournamentDao,
    private readonly participantDao: TournamentParticipantDao,
    private readonly matchDao: MatchDao,
    private readonly logger?: Logger
  ) {}

  // ============================================================================
  // Tournament CRUD
  // ============================================================================

  async createTournament(data: CreateTournamentData): Promise<Tournament> {
    const active = await this.participantDao.getActiveTournament(data.createdBy);
    if (active) {
      throw new TournamentError('Already in an active tournament', 'ALREADY_IN_TOURNAMENT');
    }

    const tournament = await this.tournamentDao.create(data);
    this.log('info', `Tournament ${tournament.id} created by user ${data.createdBy}`, {
      tournamentId: tournament.id,
      name: tournament.name
    });

    return tournament;
  }

  async getTournament(tournamentId: number): Promise<Tournament | null> {
    return await this.tournamentDao.findById(tournamentId);
  }

  async getTournamentSummary(tournamentId: number): Promise<TournamentSummary | null> {
    return await this.tournamentDao.findByIdWithParticipantCount(tournamentId);
  }

  async getOpenTournaments(): Promise<TournamentSummary[]> {
    return await this.tournamentDao.findOpen();
  }

  async getTournamentsByStatus(status: TournamentStatus): Promise<Tournament[]> {
    return await this.tournamentDao.findByStatus(status);
  }

  async cancelTournament(tournamentId: number, userId: number): Promise<Tournament> {
    const tournament = await this.tournamentDao.findById(tournamentId);

    if (!tournament) {
      throw new TournamentError('Tournament not found', 'NOT_FOUND');
    }

    if (tournament.createdBy !== userId) {
      throw new TournamentError('Only the creator can cancel the tournament', 'UNAUTHORIZED');
    }

    if (tournament.status !== 'REGISTRATION' && tournament.status !== 'SCHEDULED') {
      throw new TournamentError(
        'Cannot cancel tournament that is in progress or completed',
        'INVALID_STATUS'
      );
    }

    const updated = await this.tournamentDao.updateStatus(tournamentId, 'CANCELLED');
    this.log('info', `Tournament ${tournamentId} cancelled by user ${userId}`);

    return updated;
  }

  // ============================================================================
  // Registration
  // ============================================================================

  async register(tournamentId: number, userId: number, username: string): Promise<{ full: boolean }> {
    const tournament = await this.tournamentDao.findById(tournamentId);

    if (!tournament) {
      throw new TournamentError('Tournament not found', 'NOT_FOUND');
    }

    if (tournament.status !== 'REGISTRATION') {
      throw new TournamentError('Tournament is not open for registration', 'REGISTRATION_CLOSED');
    }

    if (tournament.registrationEnd <= new Date()) {
      throw new TournamentError('Registration has ended', 'REGISTRATION_ENDED');
    }

    const isRegistered = await this.participantDao.isRegistered(tournamentId, userId);
    if (isRegistered) {
      throw new TournamentError('Already registered for this tournament', 'ALREADY_REGISTERED');
    }

    const active = await this.participantDao.getActiveTournament(userId);
    if (active) {
      throw new TournamentError('Already in an active tournament', 'ALREADY_IN_TOURNAMENT');
    }

    const hasCapacity = await this.tournamentDao.hasCapacity(tournamentId);
    if (!hasCapacity) {
      throw new TournamentError('Tournament is full', 'TOURNAMENT_FULL');
    }

    await this.participantDao.register(tournamentId, userId, username);

    const count = await this.participantDao.count(tournamentId);
    if (count > tournament.maxPlayers) {
      await this.participantDao.unregister(tournamentId, userId);
      throw new TournamentError('Tournament is full', 'TOURNAMENT_FULL');
    }

    this.log('info', `User ${userId} registered for tournament ${tournamentId}`);
    return { full: count >= tournament.maxPlayers };
  }

  async unregister(tournamentId: number, userId: number): Promise<void> {
    const tournament = await this.tournamentDao.findById(tournamentId);

    if (!tournament) {
      throw new TournamentError('Tournament not found', 'NOT_FOUND');
    }

    if (tournament.status !== 'REGISTRATION') {
      throw new TournamentError(
        'Cannot unregister after registration closes',
        'REGISTRATION_CLOSED'
      );
    }

    const isRegistered = await this.participantDao.isRegistered(tournamentId, userId);
    if (!isRegistered) {
      throw new TournamentError('Not registered for this tournament', 'NOT_REGISTERED');
    }

    await this.participantDao.unregister(tournamentId, userId);
    this.log('info', `User ${userId} unregistered from tournament ${tournamentId}`);
  }

  async isRegistered(tournamentId: number, userId: number): Promise<boolean> {
    return await this.participantDao.isRegistered(tournamentId, userId);
  }

  async getParticipantIds(tournamentId: number): Promise<number[]> {
    return await this.participantDao.getParticipantUserIds(tournamentId);
  }

  /**
   * Check if user can create or join a tournament.
   * Returns active tournament info if any, with whether user is its creator.
   */
  async getUserTournamentStatus(userId: number): Promise<{
    activeTournamentId: number | null;
    isCreator: boolean;
  }> {
    const active = await this.participantDao.getActiveTournament(userId);
    if (!active) {
      return { activeTournamentId: null, isCreator: false };
    }
    return {
      activeTournamentId: active.tournamentId,
      isCreator: active.createdBy === userId
    };
  }

  // ============================================================================
  // Tournament Lifecycle
  // ============================================================================

  async closeRegistration(tournamentId: number): Promise<Tournament> {
    const tournament = await this.tournamentDao.findById(tournamentId);

    if (!tournament) {
      throw new TournamentError('Tournament not found', 'NOT_FOUND');
    }

    if (tournament.status !== 'REGISTRATION') {
      throw new TournamentError('Tournament is not in registration', 'INVALID_STATUS');
    }

    const hasMinimum = await this.tournamentDao.hasMinimumPlayers(tournamentId);
    if (!hasMinimum) {
      const cancelled = await this.tournamentDao.updateStatus(tournamentId, 'CANCELLED');
      this.log('info', `Tournament ${tournamentId} cancelled: insufficient players`);
      return cancelled;
    }

    const updated = await this.tournamentDao.updateStatus(tournamentId, 'SCHEDULED');
    this.log('info', `Tournament ${tournamentId} registration closed, status: SCHEDULED`);

    return updated;
  }

  /**
   * Start the tournament — generate the knockout bracket and activate the first match.
   * Returns the first-round match that was activated (has a deadline set).
   */
  async startTournament(tournamentId: number): Promise<Match> {
    const tournament = await this.tournamentDao.findById(tournamentId);

    if (!tournament) {
      throw new TournamentError('Tournament not found', 'NOT_FOUND');
    }

    if (tournament.status !== 'SCHEDULED') {
      throw new TournamentError('Tournament must be SCHEDULED to start', 'INVALID_STATUS');
    }

    const participants = await this.participantDao.getParticipantsWithUsernames(tournamentId);

    if (participants.length < tournament.minPlayers) {
      throw new TournamentError('Not enough players to start', 'INSUFFICIENT_PLAYERS');
    }

    await this.tournamentDao.updateStatus(tournamentId, 'IN_PROGRESS');

    try {
      const firstMatch = await this.generateBracket(
        tournamentId,
        participants,
        tournament.ackDeadlineMin
      );

      this.log('info', `Tournament ${tournamentId} started (knockout)`, {
        playerCount: participants.length
      });
      return firstMatch;
    } catch (error) {
      await this.tournamentDao.updateStatus(tournamentId, 'SCHEDULED');
      this.log('error', `Failed to generate bracket for tournament ${tournamentId}, reverted to SCHEDULED`);
      throw error;
    }
  }

  // ============================================================================
  // Bracket Generation
  // ============================================================================

  /**
   * Generate a single-elimination bracket.
   *
   * - Shuffles participants randomly for seeding
   * - If player count is not a power of 2, some players get byes into round 2
   * - Only creates round 1 matches (later rounds are created as winners advance)
   * - Activates the first match (sets deadline), rest are queued
   *
   * Returns the first activated match.
   */
  private async generateBracket(
    tournamentId: number,
    participants: Array<{ userId: number; username: string }>,
    ackDeadlineMin: number
  ): Promise<Match> {
    // Fisher-Yates shuffle for unbiased random seeding
    const shuffled = [...participants];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Assign seeds
    for (let i = 0; i < shuffled.length; i++) {
      await this.participantDao.setSeed(tournamentId, shuffled[i].userId, i + 1);
    }

    const n = shuffled.length;
    const totalRounds = Math.ceil(Math.log2(n));
    const fullBracketSize = Math.pow(2, totalRounds);
    const byeCount = fullBracketSize - n;

    // Store totalRounds on the tournament
    await this.tournamentDao.update(tournamentId, { totalRounds });

    // Players at the top of the seeding get byes (they advance to round 2 automatically).
    // The remaining players pair up for round 1 matches.
    const byePlayers = shuffled.slice(0, byeCount);
    const matchPlayers = shuffled.slice(byeCount);

    const matches: Match[] = [];
    let bracketPosition = 0;

    for (let i = 0; i < matchPlayers.length; i += 2) {
      const p1 = matchPlayers[i];
      const p2 = matchPlayers[i + 1];
      const isFirst = matches.length === 0;

      const match = await this.matchDao.create({
        player1Id: p1.userId,
        player2Id: p2.userId,
        player1Username: p1.username,
        player2Username: p2.username,
        tournamentId,
        round: 1,
        bracketPosition,
        deadline: isFirst ? new Date(Date.now() + ackDeadlineMin * 60 * 1000) : null
      });

      matches.push(match);
      bracketPosition++;
    }

    this.log('info', `Generated bracket for tournament ${tournamentId}`, {
      players: n,
      totalRounds,
      round1Matches: matches.length,
      byes: byeCount,
      byePlayerIds: byePlayers.map(p => p.userId)
    });

    return matches[0];
  }

  // ============================================================================
  // Match Result Handling & Winner Advancement
  // ============================================================================

  /**
   * Activate the next queued match in the current round.
   * Returns the activated match, or null if no more queued matches.
   */
  async activateNextMatch(tournamentId: number): Promise<Match | null> {
    const tournament = await this.tournamentDao.findById(tournamentId);
    if (!tournament) return null;

    const nextMatch = await this.matchDao.findNextQueuedMatch(tournamentId);
    if (!nextMatch) return null;

    const deadline = new Date(Date.now() + tournament.ackDeadlineMin * 60 * 1000);
    const activated = await this.matchDao.activateMatch(nextMatch.id, deadline);

    this.log('info', `Activated match ${activated.id} for tournament ${tournamentId}`, {
      round: activated.round,
      bracketPosition: activated.bracketPosition
    });

    return activated;
  }

  /**
   * Process a completed tournament match.
   * - Marks the loser as eliminated
   * - Checks if the current round is complete
   * - If complete, generates the next round (pairing winners + bye players)
   * - If this was the final, finalizes the tournament
   */
  async processMatchResult(match: Match): Promise<void> {
    if (!match.tournamentId || !match.round) return;

    const tournamentId = match.tournamentId;
    const currentRound = match.round;

    // Mark loser(s) as eliminated
    if (!match.winnerId) {
      // Double forfeit — both eliminated
      await this.participantDao.eliminate(tournamentId, match.player1Id, currentRound);
      await this.participantDao.eliminate(tournamentId, match.player2Id, currentRound);
    } else {
      const loserId = match.winnerId === match.player1Id ? match.player2Id : match.player1Id;
      await this.participantDao.eliminate(tournamentId, loserId, currentRound);
    }

    // Check if all matches in this round are done
    const roundMatchCount = await this.matchDao.countInRound(tournamentId, currentRound);
    const completedMatches = await this.matchDao.findCompletedInRound(tournamentId, currentRound);

    if (completedMatches.length < roundMatchCount) {
      return; // Still matches left — lifecycle manager will activate the next one
    }

    // All matches in this round are done — advance winners to next round
    await this.advanceToNextRound(tournamentId, currentRound, completedMatches);
  }

  /**
   * Create next round matches from current round winners + bye players (round 1 only).
   */
  private async advanceToNextRound(
    tournamentId: number,
    completedRound: number,
    completedMatches: Match[]
  ): Promise<void> {
    // Collect winners in bracket position order
    const winners: Array<{ userId: number; username: string }> = [];
    for (const match of completedMatches) {
      if (match.winnerId) {
        const username = match.winnerId === match.player1Id
          ? match.player1Username
          : match.player2Username;
        winners.push({ userId: match.winnerId, username });
      }
    }

    // Add non-eliminated players who didn't play in this round (byes).
    // In round 1 these are players who got initial bracket byes;
    // in later rounds these arise from double forfeits leaving an odd winner count.
    const allParticipants = await this.participantDao.findByTournament(tournamentId);
    const roundPlayerIds = new Set(
      completedMatches.flatMap(m => [m.player1Id, m.player2Id])
    );
    const byePlayers = allParticipants
      .filter(p => !roundPlayerIds.has(p.userId) && p.eliminatedIn === null)
      .map(p => ({ userId: p.userId, username: p.username }));

    // Bye players first (higher seeds), then round winners
    const advancingPlayers = [...byePlayers, ...winners];

    // 0 or 1 players remaining = tournament over
    if (advancingPlayers.length <= 1) {
      await this.finalizeTournament(tournamentId, advancingPlayers[0]?.userId ?? null);
      return;
    }

    // Generate next round matches
    const nextRound = completedRound + 1;
    let bracketPosition = 0;

    for (let i = 0; i < advancingPlayers.length; i += 2) {
      const p1 = advancingPlayers[i];
      const p2 = advancingPlayers[i + 1];

      if (!p2) {
        // Odd player count (from double forfeits) — player gets a bye.
        // They won't have a match this round, so advanceToNextRound will
        // pick them up as a bye player when this round completes.
        this.log('info', `Player ${p1.userId} gets bye in round ${nextRound}`);
        continue;
      }

      await this.matchDao.create({
        player1Id: p1.userId,
        player2Id: p2.userId,
        player1Username: p1.username,
        player2Username: p2.username,
        tournamentId,
        round: nextRound,
        bracketPosition
      });

      bracketPosition++;
    }

    if (bracketPosition === 0 && advancingPlayers.length === 1) {
      await this.finalizeTournament(tournamentId, advancingPlayers[0].userId);
      return;
    }

    this.log('info', `Round ${nextRound} generated for tournament ${tournamentId}`, {
      matchCount: bracketPosition,
      advancingPlayers: advancingPlayers.length
    });
  }

  /**
   * Finalize the tournament — set final ranks and mark as COMPLETED.
   * Ranking: winner = 1, then by round eliminated (later = better).
   */
  private async finalizeTournament(tournamentId: number, winnerId: number | null): Promise<void> {
    const participants = await this.participantDao.findByTournament(tournamentId);

    const sorted = [...participants].sort((a, b) => {
      if (a.eliminatedIn === null && b.eliminatedIn !== null) return -1;
      if (b.eliminatedIn === null && a.eliminatedIn !== null) return 1;
      if (a.eliminatedIn === null && b.eliminatedIn === null) return 0;
      return (b.eliminatedIn ?? 0) - (a.eliminatedIn ?? 0);
    });

    const rankData = sorted.map((p, index) => ({
      tournamentId,
      userId: p.userId,
      rank: index + 1
    }));

    await this.participantDao.setAllFinalRanks(rankData);
    await this.tournamentDao.updateStatus(tournamentId, 'COMPLETED');

    this.log('info', `Tournament ${tournamentId} completed`, {
      tournamentId,
      winner: winnerId
    });
  }

  // ============================================================================
  // Rankings & Data
  // ============================================================================

  async getRankings(tournamentId: number): Promise<TournamentRanking[]> {
    const tournament = await this.tournamentDao.findById(tournamentId);

    if (!tournament) {
      throw new TournamentError('Tournament not found', 'NOT_FOUND');
    }

    return await this.participantDao.getRankings(tournamentId);
  }

  async getMatches(tournamentId: number): Promise<Match[]> {
    return await this.matchDao.findByTournamentId(tournamentId);
  }

  // ============================================================================
  // Logging
  // ============================================================================

  private log(
    level: 'info' | 'warn' | 'error',
    message: string,
    meta?: Record<string, unknown>
  ): void {
    if (this.logger) {
      this.logger[level]({ ...meta, service: 'tournament' }, message);
    } else {
      console.log(`[${level.toUpperCase()}] ${message}`, meta || '');
    }
  }
}
