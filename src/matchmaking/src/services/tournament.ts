import { Tournament, TournamentStatus, Match } from '../../generated/prisma/index.js';
import { TournamentDao } from '../dao/tournament.js';
import { TournamentParticipantDao } from '../dao/tournament-participant.js';
import { MatchDao } from '../dao/match.js';
import {
  CreateTournamentData,
  TournamentSummary,
  TournamentRanking,
  TournamentBracket,
  BracketNode
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

    // Auto-register creator as participant
    await this.participantDao.register(tournament.id, data.createdBy, data.creatorUsername);

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

  /**
   * Leave an in-progress tournament by forfeiting the player's next pending match.
   * Treated identically to declining a match ack: opponent wins 5-0, bracket advances.
   * Returns the forfeited match so the caller can notify players and run lifecycle hooks.
   */
  async leaveTournament(tournamentId: number, userId: number): Promise<Match | null> {
    const tournament = await this.tournamentDao.findById(tournamentId);
    if (!tournament) {
      throw new TournamentError('Tournament not found', 'NOT_FOUND');
    }
    if (tournament.status !== 'IN_PROGRESS') {
      throw new TournamentError(
        'Can only leave a tournament that is in progress',
        'INVALID_STATUS'
      );
    }

    const participant = await this.participantDao.findByTournamentAndUser(tournamentId, userId);
    if (!participant) {
      throw new TournamentError('Not a participant in this tournament', 'NOT_PARTICIPANT');
    }
    if (participant.eliminatedIn !== null) {
      throw new TournamentError('Already eliminated from this tournament', 'ALREADY_ELIMINATED');
    }

    const match = await this.matchDao.findPendingMatchForUserInTournament(userId, tournamentId);

    if (!match) {
      // No active match (e.g. crash left match in cancelled state and retry never arrived).
      // Just eliminate the participant so they are freed from the tournament.
      const allMatches = await this.matchDao.findByTournamentId(tournamentId);
      const lastRound = allMatches
        .filter(m => m.player1Id === userId || m.player2Id === userId)
        .reduce((max, m) => Math.max(max, m.round ?? 1), 1);
      await this.participantDao.eliminate(tournamentId, userId, lastRound);
      this.log('info', `User ${userId} left tournament ${tournamentId} with no pending match (eliminated at round ${lastRound})`);
      return null;
    }

    const winnerId = match.player1Id === userId ? match.player2Id : match.player1Id;
    const isPlayer1 = match.player1Id === userId;

    await this.matchDao.completeMatch(match.id, {
      winnerId,
      player1Score: isPlayer1 ? 0 : 5,
      player2Score: isPlayer1 ? 5 : 0,
      resultSource: `forfeit:left_tournament:${userId}`
    });

    const forfeited = await this.matchDao.updateStatus(match.id, 'FORFEITED');
    this.log('info', `User ${userId} left tournament ${tournamentId}, forfeiting match ${match.id}`);
    return forfeited;
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

    if (tournament.createdBy === userId) {
      throw new TournamentError(
        'Tournament creator cannot unregister. Cancel the tournament instead.',
        'CREATOR_CANNOT_LEAVE'
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
   * Start the tournament — generate the knockout bracket and activate all first-round matches.
   * Returns all activated first-round matches.
   */
  async startTournament(tournamentId: number): Promise<Match[]> {
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
      const matches = await this.generateBracket(
        tournamentId,
        participants,
        tournament.ackDeadlineMin,
        tournament.gameMode
      );

      this.log('info', `Tournament ${tournamentId} started (knockout)`, {
        playerCount: participants.length
      });
      return matches;
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
   * - Activates all round 1 matches simultaneously (sets deadline on all)
   *
   * Returns all activated round 1 matches.
   */
  private async generateBracket(
    tournamentId: number,
    participants: Array<{ userId: number; username: string }>,
    ackDeadlineMin: number,
    gameMode: string
  ): Promise<Match[]> {
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
      const deadline = new Date(Date.now() + ackDeadlineMin * 60 * 1000);

      const match = await this.matchDao.create({
        player1Id: p1.userId,
        player2Id: p2.userId,
        player1Username: p1.username,
        player2Username: p2.username,
        tournamentId,
        round: 1,
        bracketPosition,
        deadline,
        gameMode
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

    return matches;
  }

  // ============================================================================
  // Match Result Handling & Winner Advancement
  // ============================================================================

  /**
   * Activate all queued matches for the next round.
   * Returns the activated matches, or empty array if none.
   */
  async activateRoundMatches(tournamentId: number): Promise<Match[]> {
    const tournament = await this.tournamentDao.findById(tournamentId);
    if (!tournament) return [];

    const queuedMatches = await this.matchDao.findAllQueuedMatches(tournamentId);
    if (queuedMatches.length === 0) return [];

    const deadline = new Date(Date.now() + tournament.ackDeadlineMin * 60 * 1000);
    const matchIds = queuedMatches.map(m => m.id);
    const activated = await this.matchDao.activateMatches(matchIds, deadline);

    this.log('info', `Activated ${activated.length} matches for tournament ${tournamentId}`, {
      round: activated[0]?.round
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

    const tournament = await this.tournamentDao.findById(tournamentId);
    const gameMode = tournament?.gameMode ?? 'classic';

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
        bracketPosition,
        gameMode
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

  /**
   * Build a binary-tree bracket array for a knockout tournament.
   *
   * Layout: level-order (BFS), root = final at index 0.
   * Total size = 2^totalRounds - 1.
   * Unplayed/future slots are TBD nodes; bye slots show the real player + BYE opponent.
   *
   * Round numbering in the DB: round 1 = first round played, round N = final.
   * Tree depth: depth 0 = root = final (round totalRounds), depth d = round (totalRounds - d).
   *
   * Bye-slot index formula (round 1 only):
   *   Bye players occupy the first `byeCount` positions at the leaf level.
   *   Round 1 matches are shifted right: leafDepthStart + byeCount + bracketPosition.
   *   byeCount = leafSlots - round1MatchCount  (where leafSlots = 2^(totalRounds-1))
   *
   * For rounds > 1, byes no longer shift positions: depthStart + bracketPosition.
   */
  async getBracket(tournamentId: number): Promise<TournamentBracket> {
    const tournament = await this.tournamentDao.findById(tournamentId);

    if (!tournament) {
      throw new TournamentError('Tournament not found', 'NOT_FOUND');
    }

    const totalRounds = tournament.totalRounds ?? 0;
    const treeSize = totalRounds > 0 ? Math.pow(2, totalRounds) - 1 : 0;

    const tbd: BracketNode = {
      player1Id: null,
      player1Username: 'TBD',
      player2Id: null,
      player2Username: 'TBD',
      winnerId: null,
      status: 'TBD'
    };

    const bracket: BracketNode[] = Array.from({ length: treeSize }, () => ({ ...tbd }));

    if (totalRounds === 0) {
      return { tournamentId, totalRounds, status: tournament.status, bracket };
    }

    const matches = await this.matchDao.findByTournamentId(tournamentId);

    const leafDepthStart = Math.pow(2, totalRounds - 1) - 1;
    const leafSlots = Math.pow(2, totalRounds - 1);
    const round1MatchCount = matches.filter(m => m.round === 1).length;
    const byeCount = leafSlots - round1MatchCount;

    // Populate match nodes
    for (const match of matches) {
      if (match.round === null || match.bracketPosition === null) continue;

      let index: number;
      if (match.round === 1) {
        // Round 1 matches are shifted right past the bye slots at the leaf level
        index = leafDepthStart + byeCount + match.bracketPosition;
      } else {
        // All later rounds: straightforward level-order mapping
        const depth = totalRounds - match.round;
        const depthStart = Math.pow(2, depth) - 1;
        index = depthStart + match.bracketPosition;
      }

      if (index < 0 || index >= treeSize) continue;

      bracket[index] = {
        player1Id: match.player1Id,
        player1Username: match.player1Username,
        player2Id: match.player2Id,
        player2Username: match.player2Username,
        winnerId: match.winnerId ?? null,
        status: match.status
      };
    }

    // Populate bye slots: first byeCount positions at the leaf level.
    // Bye players are the lowest-seeded participants (seed 1..byeCount).
    // Leaf position i corresponds to the player with seed i+1.
    if (byeCount > 0) {
      const participants = await this.participantDao.findByTournament(tournamentId);
      const byePlayers = participants
        .filter(p => p.seed !== null && p.seed <= byeCount)
        .sort((a, b) => (a.seed ?? 0) - (b.seed ?? 0));

      for (let i = 0; i < byePlayers.length; i++) {
        const p = byePlayers[i];
        bracket[leafDepthStart + i] = {
          player1Id: p.userId,
          player1Username: p.username,
          player2Id: null,
          player2Username: 'BYE',
          winnerId: p.userId,
          status: 'BYE'
        };
      }
    }

    return { tournamentId, totalRounds, status: tournament.status, bracket };
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
