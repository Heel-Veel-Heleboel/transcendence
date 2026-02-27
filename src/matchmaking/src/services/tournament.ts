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
 * Manages tournament lifecycle, registration, and match generation
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

  /**
   * Create a new tournament
   */
  async createTournament(data: CreateTournamentData): Promise<Tournament> {
    // Validate registration end is in the future
    if (data.registrationEnd <= new Date()) {
      throw new TournamentError(
        'Registration end must be in the future',
        'INVALID_REGISTRATION_END'
      );
    }

    // Validate player limits
    if (data.minPlayers != null && data.maxPlayers != null && data.minPlayers > data.maxPlayers) {
      throw new TournamentError(
        'minPlayers must be less than or equal to maxPlayers',
        'INVALID_PLAYER_LIMITS'
      );
    }

    // Validate start time if provided
    if (data.startTime && data.startTime <= data.registrationEnd) {
      throw new TournamentError(
        'Start time must be after registration end',
        'INVALID_START_TIME'
      );
    }

    const tournament = await this.tournamentDao.create(data);
    this.log('info', `Tournament ${tournament.id} created by user ${data.createdBy}`, {
      tournamentId: tournament.id,
      name: tournament.name
    });

    return tournament;
  }

  /**
   * Get tournament by ID
   */
  async getTournament(tournamentId: number): Promise<Tournament | null> {
    return await this.tournamentDao.findById(tournamentId);
  }

  /**
   * Get tournament with participant count
   */
  async getTournamentSummary(tournamentId: number): Promise<TournamentSummary | null> {
    return await this.tournamentDao.findByIdWithParticipantCount(tournamentId);
  }

  /**
   * Get all open tournaments (accepting registrations)
   */
  async getOpenTournaments(): Promise<TournamentSummary[]> {
    return await this.tournamentDao.findOpen();
  }

  /**
   * Get tournaments by status
   */
  async getTournamentsByStatus(status: TournamentStatus): Promise<Tournament[]> {
    return await this.tournamentDao.findByStatus(status);
  }

  /**
   * Cancel a tournament
   * Only allowed during REGISTRATION or SCHEDULED status
   */
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

  /**
   * Register a user for a tournament
   * Returns true if tournament is now full (max players reached)
   */
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

    // Check if already registered
    const isRegistered = await this.participantDao.isRegistered(tournamentId, userId);
    if (isRegistered) {
      throw new TournamentError('Already registered for this tournament', 'ALREADY_REGISTERED');
    }

    // Check capacity
    const hasCapacity = await this.tournamentDao.hasCapacity(tournamentId);
    if (!hasCapacity) {
      throw new TournamentError('Tournament is full', 'TOURNAMENT_FULL');
    }

    await this.participantDao.register(tournamentId, userId, username);

    // Guard against race condition: if we exceeded capacity, roll back
    const count = await this.participantDao.count(tournamentId);
    if (count > tournament.maxPlayers) {
      await this.participantDao.unregister(tournamentId, userId);
      throw new TournamentError('Tournament is full', 'TOURNAMENT_FULL');
    }

    this.log('info', `User ${userId} registered for tournament ${tournamentId}`);
    return { full: count >= tournament.maxPlayers };
  }

  /**
   * Unregister a user from a tournament
   */
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

  /**
   * Check if a user is registered for a tournament
   */
  async isRegistered(tournamentId: number, userId: number): Promise<boolean> {
    return await this.participantDao.isRegistered(tournamentId, userId);
  }

  /**
   * Get participant user IDs for a tournament
   */
  async getParticipantIds(tournamentId: number): Promise<number[]> {
    return await this.participantDao.getParticipantUserIds(tournamentId);
  }

  // ============================================================================
  // Tournament Lifecycle
  // ============================================================================

  /**
   * Close registration and transition to SCHEDULED
   * Called by scheduler when registration deadline passes
   */
  async closeRegistration(tournamentId: number): Promise<Tournament> {
    const tournament = await this.tournamentDao.findById(tournamentId);

    if (!tournament) {
      throw new TournamentError('Tournament not found', 'NOT_FOUND');
    }

    if (tournament.status !== 'REGISTRATION') {
      throw new TournamentError('Tournament is not in registration', 'INVALID_STATUS');
    }

    // Check minimum players
    const hasMinimum = await this.tournamentDao.hasMinimumPlayers(tournamentId);
    if (!hasMinimum) {
      // Cancel tournament if not enough players
      const cancelled = await this.tournamentDao.updateStatus(tournamentId, 'CANCELLED');
      this.log('info', `Tournament ${tournamentId} cancelled: insufficient players`);
      return cancelled;
    }

    const updated = await this.tournamentDao.updateStatus(tournamentId, 'SCHEDULED');
    this.log('info', `Tournament ${tournamentId} registration closed, status: SCHEDULED`);

    return updated;
  }

  /**
   * Start the tournament - generate matches and transition to IN_PROGRESS
   * Called by scheduler when start time arrives (or immediately after closeRegistration if no start time)
   */
  async startTournament(tournamentId: number): Promise<Match[]> {
    const tournament = await this.tournamentDao.findById(tournamentId);

    if (!tournament) {
      throw new TournamentError('Tournament not found', 'NOT_FOUND');
    }

    if (tournament.status !== 'SCHEDULED') {
      throw new TournamentError('Tournament must be SCHEDULED to start', 'INVALID_STATUS');
    }

    // Get participants with usernames
    const participants = await this.participantDao.getParticipantsWithUsernames(tournamentId);

    if (participants.length < tournament.minPlayers) {
      throw new TournamentError('Not enough players to start', 'INSUFFICIENT_PLAYERS');
    }

    // Update status to IN_PROGRESS before generating matches
    // This prevents duplicate startTournament calls if generation takes time
    await this.tournamentDao.updateStatus(tournamentId, 'IN_PROGRESS');

    try {
      const matches = await this.generateRoundRobinMatches(
        tournamentId,
        participants,
        tournament.matchDeadlineMin
      );

      this.log('info', `Tournament ${tournamentId} started with ${matches.length} matches`);
      return matches;
    } catch (error) {
      // Revert status if match generation fails
      await this.tournamentDao.updateStatus(tournamentId, 'SCHEDULED');
      this.log('error', `Failed to generate matches for tournament ${tournamentId}, reverted to SCHEDULED`);
      throw error;
    }
  }

  /**
   * Generate round-robin matches for all participants
   * Each player plays against every other player once
   */
  private async generateRoundRobinMatches(
    tournamentId: number,
    participants: Array<{ userId: number; username: string }>,
    matchDeadlineMin: number
  ): Promise<Match[]> {
    const matches: Match[] = [];
    const deadline = new Date(Date.now() + matchDeadlineMin * 60 * 1000);

    // Generate all pairings: n*(n-1)/2 matches
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        const player1 = participants[i];
        const player2 = participants[j];

        const match = await this.matchDao.create({
          player1Id: player1.userId,
          player2Id: player2.userId,
          player1Username: player1.username,
          player2Username: player2.username,
          tournamentId,
          deadline
        });

        matches.push(match);
      }
    }

    this.log('info', `Generated ${matches.length} round-robin matches for tournament ${tournamentId}`);
    return matches;
  }

  // ============================================================================
  // Match Result Handling
  // ============================================================================

  /**
   * Process a completed match result
   * Updates participant stats and checks if tournament is complete
   */
  async processMatchResult(match: Match): Promise<void> {
    if (!match.tournamentId) {
      return; // Not a tournament match
    }

    const tournamentId = match.tournamentId;
    const scoreDiff = (match.player1Score ?? 0) - (match.player2Score ?? 0);

    // Update winner stats
    if (match.winnerId === match.player1Id) {
      await this.participantDao.incrementWins(tournamentId, match.player1Id, scoreDiff);
      await this.participantDao.incrementLosses(tournamentId, match.player2Id, -scoreDiff);
    } else if (match.winnerId === match.player2Id) {
      await this.participantDao.incrementWins(tournamentId, match.player2Id, -scoreDiff);
      await this.participantDao.incrementLosses(tournamentId, match.player1Id, scoreDiff);
    } else {
      // Both forfeit case (winnerId is null)
      await this.participantDao.incrementLosses(tournamentId, match.player1Id, scoreDiff);
      await this.participantDao.incrementLosses(tournamentId, match.player2Id, -scoreDiff);
    }

    // Check if all matches are complete
    await this.checkTournamentCompletion(tournamentId);
  }

  /**
   * Check if all tournament matches are complete and finalize if so
   * Guards against concurrent calls by checking tournament status first
   */
  private async checkTournamentCompletion(tournamentId: number): Promise<void> {
    // Guard: check current tournament status to prevent duplicate finalization
    const tournament = await this.tournamentDao.findById(tournamentId);
    if (!tournament || tournament.status === 'COMPLETED' || tournament.status === 'CANCELLED') {
      return;
    }

    const matches = await this.matchDao.findByTournamentId(tournamentId);

    const allComplete = matches.every(
      m => m.status === 'COMPLETED' || m.status === 'FORFEITED' || m.status === 'TIMEOUT'
    );

    if (!allComplete) {
      return;
    }

    // Check for ties that need golden game (only if not already in TIE_BREAKER)
    if (tournament.status !== 'TIE_BREAKER') {
      const needsGoldenGame = await this.checkForTies(tournamentId);

      if (needsGoldenGame) {
        await this.tournamentDao.updateStatus(tournamentId, 'TIE_BREAKER');
        this.log('info', `Tournament ${tournamentId} entering TIE_BREAKER`);
        return;
      }
    }

    await this.finalizeTournament(tournamentId);
  }

  /**
   * Check if there are ties at the top that need golden game
   * Returns true if golden game was scheduled
   */
  private async checkForTies(tournamentId: number): Promise<boolean> {
    const rankings = await this.participantDao.getRankings(tournamentId);

    if (rankings.length < 2) {
      return false;
    }

    // Check if top 2 are tied on wins and scoreDiff
    const first = rankings[0];
    const second = rankings[1];

    if (first.wins !== second.wins || first.scoreDiff !== second.scoreDiff) {
      return false; // No tie at top
    }

    // Check head-to-head between tied players
    const tiedPlayers = rankings.filter(
      r => r.wins === first.wins && r.scoreDiff === first.scoreDiff
    );

    if (tiedPlayers.length === 2) {
      // Check head-to-head result
      const h2hResult = await this.calculateHeadToHead(
        tournamentId,
        tiedPlayers.map(p => p.userId)
      );

      // If head-to-head is also tied, schedule golden game
      if (this.isHeadToHeadTied(h2hResult)) {
        await this.scheduleGoldenGame(tournamentId, tiedPlayers[0].userId, tiedPlayers[1].userId);
        return true;
      }
    } else if (tiedPlayers.length > 2) {
      // Multiple players tied - need more complex resolution
      // For now, just schedule golden games between all of them
      // In practice, this is rare in small tournaments
      this.log('warn', `Tournament ${tournamentId} has ${tiedPlayers.length} players tied - complex resolution needed`);
      // Schedule golden game between first two for simplicity
      await this.scheduleGoldenGame(tournamentId, tiedPlayers[0].userId, tiedPlayers[1].userId);
      return true;
    }

    return false;
  }

  /**
   * Calculate head-to-head score difference between tied players
   */
  private async calculateHeadToHead(
    tournamentId: number,
    playerIds: number[]
  ): Promise<Map<number, number>> {
    const matches = await this.matchDao.findBetweenPlayers(tournamentId, playerIds);
    const h2h = new Map<number, number>();

    // Initialize all players to 0
    for (const id of playerIds) {
      h2h.set(id, 0);
    }

    for (const match of matches) {
      const p1Diff = (match.player1Score ?? 0) - (match.player2Score ?? 0);
      h2h.set(match.player1Id, (h2h.get(match.player1Id) ?? 0) + p1Diff);
      h2h.set(match.player2Id, (h2h.get(match.player2Id) ?? 0) - p1Diff);
    }

    return h2h;
  }

  /**
   * Check if head-to-head results are tied
   */
  private isHeadToHeadTied(h2h: Map<number, number>): boolean {
    const values = Array.from(h2h.values());
    return values.every(v => v === values[0]);
  }

  /**
   * Schedule a golden game between two tied players
   */
  private async scheduleGoldenGame(
    tournamentId: number,
    player1Id: number,
    player2Id: number
  ): Promise<Match> {
    const tournament = await this.tournamentDao.findById(tournamentId);
    const deadline = new Date(Date.now() + (tournament?.matchDeadlineMin ?? 30) * 60 * 1000);

    const match = await this.matchDao.create({
      player1Id,
      player2Id,
      player1Username: `User${player1Id}`, // TODO: lookup username
      player2Username: `User${player2Id}`,
      tournamentId,
      deadline,
      isGoldenGame: true
    });

    this.log('info', `Golden game scheduled for tournament ${tournamentId}: ${player1Id} vs ${player2Id}`);
    return match;
  }

  /**
   * Finalize tournament - set final ranks and update status
   * If we reach here, all ties are resolvable (golden games resolved remaining ones)
   * Rankings are sorted by: wins → scoreDiff → head-to-head
   */
  private async finalizeTournament(tournamentId: number): Promise<void> {
    const rankings = await this.participantDao.getRankings(tournamentId);

    // Resolve any remaining ties using head-to-head
    const resolved = await this.resolveRankingTies(tournamentId, rankings);

    const rankData = resolved.map((r, index) => ({
      tournamentId,
      userId: r.userId,
      rank: index + 1
    }));

    await this.participantDao.setAllFinalRanks(rankData);
    await this.tournamentDao.updateStatus(tournamentId, 'COMPLETED');

    this.log('info', `Tournament ${tournamentId} completed`, {
      tournamentId,
      winner: resolved[0]?.userId
    });
  }

  /**
   * Resolve ties in rankings using head-to-head results
   * Groups players with same wins and scoreDiff, then sorts within group by h2h
   */
  private async resolveRankingTies(
    tournamentId: number,
    rankings: TournamentRanking[]
  ): Promise<TournamentRanking[]> {
    const resolved: TournamentRanking[] = [];
    let i = 0;

    while (i < rankings.length) {
      const current = rankings[i];
      let j = i + 1;
      while (
        j < rankings.length &&
        rankings[j].wins === current.wins &&
        rankings[j].scoreDiff === current.scoreDiff
      ) {
        j++;
      }

      if (j - i === 1) {
        resolved.push(current);
      } else {
        // Tied group — sort by head-to-head
        const tiedGroup = rankings.slice(i, j);
        const playerIds = tiedGroup.map(r => r.userId);
        const h2h = await this.calculateHeadToHead(tournamentId, playerIds);

        tiedGroup.sort((a, b) => (h2h.get(b.userId) ?? 0) - (h2h.get(a.userId) ?? 0));
        resolved.push(...tiedGroup);
      }

      i = j;
    }

    return resolved;
  }

  // ============================================================================
  // Rankings & Leaderboard
  // ============================================================================

  /**
   * Get current rankings for a tournament
   */
  async getRankings(tournamentId: number): Promise<TournamentRanking[]> {
    const tournament = await this.tournamentDao.findById(tournamentId);

    if (!tournament) {
      throw new TournamentError('Tournament not found', 'NOT_FOUND');
    }

    return await this.participantDao.getRankings(tournamentId);
  }

  /**
   * Get matches for a tournament
   */
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
