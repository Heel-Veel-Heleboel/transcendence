import { Tournament, Match } from '../../generated/prisma/index.js';
import { TournamentService } from './tournament.js';
import { TournamentDao } from '../dao/tournament.js';
import { MatchDao } from '../dao/match.js';
import { Logger } from '../types/logger.js';

/**
 * Timer abstraction for testability
 * In production, uses setTimeout/clearTimeout
 * In tests, can be mocked
 */
export interface TimerProvider {
  setTimeout(callback: () => void, ms: number): NodeJS.Timeout;
  clearTimeout(timer: NodeJS.Timeout): void;
}

/**
 * Default timer provider using Node.js built-ins
 */
export const defaultTimerProvider: TimerProvider = {
  setTimeout: (callback, ms) => setTimeout(callback, ms),
  clearTimeout: (timer) => clearTimeout(timer)
};

/**
 * Scheduled event types
 */
type ScheduledEventType = 'registration_end' | 'tournament_start' | 'match_deadline';

interface ScheduledEvent {
  type: ScheduledEventType;
  timer: NodeJS.Timeout;
  targetTime: Date;
}

/**
 * TournamentLifecycleManager
 *
 * Manages time-based events for tournaments:
 * - Registration end → Close registration, cancel if not enough players
 * - Tournament start → Generate matches, transition to IN_PROGRESS
 * - Match deadline → Forfeit match if not completed
 *
 * Uses event-driven timers with database as source of truth.
 * On startup, recovers pending events from database.
 */
export class TournamentLifecycleManager {
  // Track scheduled timers: tournamentId/matchId → event
  private tournamentTimers = new Map<number, ScheduledEvent>();
  private matchTimers = new Map<string, ScheduledEvent>();

  constructor(
    private readonly tournamentService: TournamentService,
    private readonly tournamentDao: TournamentDao,
    private readonly matchDao: MatchDao,
    private readonly timerProvider: TimerProvider = defaultTimerProvider,
    private readonly logger?: Logger
  ) {}

  /**
   * Initialize the lifecycle manager
   * Recovers any pending events from the database
   */
  async initialize(): Promise<void> {
    this.log('info', 'Initializing tournament lifecycle manager');

    // Recover tournaments in REGISTRATION status
    const registrationTournaments = await this.tournamentDao.findByStatus('REGISTRATION');
    for (const tournament of registrationTournaments) {
      if (tournament.registrationEnd > new Date()) {
        this.scheduleRegistrationEnd(tournament);
      } else {
        // Registration already ended, process immediately
        await this.handleRegistrationEnd(tournament.id);
      }
    }

    // Recover tournaments in SCHEDULED status
    const scheduledTournaments = await this.tournamentDao.findByStatus('SCHEDULED');
    for (const tournament of scheduledTournaments) {
      if (tournament.startTime && tournament.startTime > new Date()) {
        this.scheduleTournamentStart(tournament);
      } else {
        // Start time passed or no start time, start immediately
        await this.handleTournamentStart(tournament.id);
      }
    }

    // Recover pending matches with deadlines
    const pendingMatches = await this.matchDao.findPendingWithDeadline();
    for (const match of pendingMatches) {
      if (match.deadline && match.deadline > new Date()) {
        this.scheduleMatchDeadline(match);
      } else if (match.deadline) {
        // Deadline passed, process immediately
        await this.handleMatchDeadline(match.id);
      }
    }

    this.log('info', 'Tournament lifecycle manager initialized', {
      tournamentTimers: this.tournamentTimers.size,
      matchTimers: this.matchTimers.size
    });
  }

  /**
   * Shutdown the lifecycle manager
   * Cancels all pending timers
   */
  shutdown(): void {
    this.log('info', 'Shutting down tournament lifecycle manager');

    for (const event of this.tournamentTimers.values()) {
      this.timerProvider.clearTimeout(event.timer);
    }
    this.tournamentTimers.clear();

    for (const event of this.matchTimers.values()) {
      this.timerProvider.clearTimeout(event.timer);
    }
    this.matchTimers.clear();

    this.log('info', 'Tournament lifecycle manager shut down');
  }

  // ============================================================================
  // Tournament Events
  // ============================================================================

  /**
   * Called when a new tournament is created
   * Schedules the registration end timer
   */
  onTournamentCreated(tournament: Tournament): void {
    this.scheduleRegistrationEnd(tournament);
    this.log('info', `Scheduled registration end for tournament ${tournament.id}`, {
      tournamentId: tournament.id,
      registrationEnd: tournament.registrationEnd
    });
  }

  /**
   * Called when tournament registration becomes full
   * Cancels registration timer and immediately closes registration
   */
  async onRegistrationFull(tournamentId: number): Promise<void> {
    // Cancel existing registration timer
    this.cancelTournamentTimer(tournamentId);

    // Close registration immediately
    await this.handleRegistrationEnd(tournamentId);
  }

  /**
   * Called when a tournament is cancelled
   * Cancels any pending timers
   */
  onTournamentCancelled(tournamentId: number): void {
    this.cancelTournamentTimer(tournamentId);
    this.log('info', `Cancelled timers for tournament ${tournamentId}`);
  }

  // ============================================================================
  // Match Events
  // ============================================================================

  /**
   * Called when a match is created
   * Schedules the deadline timer
   */
  onMatchCreated(match: Match): void {
    if (match.deadline) {
      this.scheduleMatchDeadline(match);
    }
  }

  /**
   * Called when a match is completed/forfeited
   * Cancels the deadline timer
   */
  onMatchCompleted(matchId: string): void {
    this.cancelMatchTimer(matchId);
  }

  // ============================================================================
  // Internal: Scheduling
  // ============================================================================

  private scheduleRegistrationEnd(tournament: Tournament): void {
    const delay = tournament.registrationEnd.getTime() - Date.now();

    if (delay <= 0) {
      // Already passed, handle immediately
      this.handleRegistrationEnd(tournament.id).catch(err => {
        this.log('error', `Error handling registration end for tournament ${tournament.id}`, { error: err });
      });
      return;
    }

    const timer = this.timerProvider.setTimeout(() => {
      this.handleRegistrationEnd(tournament.id).catch(err => {
        this.log('error', `Error handling registration end for tournament ${tournament.id}`, { error: err });
      });
    }, delay);

    this.tournamentTimers.set(tournament.id, {
      type: 'registration_end',
      timer,
      targetTime: tournament.registrationEnd
    });
  }

  private scheduleTournamentStart(tournament: Tournament): void {
    if (!tournament.startTime) return;

    const delay = tournament.startTime.getTime() - Date.now();

    if (delay <= 0) {
      // Already passed, handle immediately
      this.handleTournamentStart(tournament.id).catch(err => {
        this.log('error', `Error handling tournament start for tournament ${tournament.id}`, { error: err });
      });
      return;
    }

    const timer = this.timerProvider.setTimeout(() => {
      this.handleTournamentStart(tournament.id).catch(err => {
        this.log('error', `Error handling tournament start for tournament ${tournament.id}`, { error: err });
      });
    }, delay);

    this.tournamentTimers.set(tournament.id, {
      type: 'tournament_start',
      timer,
      targetTime: tournament.startTime
    });
  }

  private scheduleMatchDeadline(match: Match): void {
    if (!match.deadline) return;

    const delay = match.deadline.getTime() - Date.now();

    if (delay <= 0) {
      // Already passed, handle immediately
      this.handleMatchDeadline(match.id).catch(err => {
        this.log('error', `Error handling match deadline for match ${match.id}`, { error: err });
      });
      return;
    }

    const timer = this.timerProvider.setTimeout(() => {
      this.handleMatchDeadline(match.id).catch(err => {
        this.log('error', `Error handling match deadline for match ${match.id}`, { error: err });
      });
    }, delay);

    this.matchTimers.set(match.id, {
      type: 'match_deadline',
      timer,
      targetTime: match.deadline
    });
  }

  // ============================================================================
  // Internal: Event Handlers
  // ============================================================================

  private async handleRegistrationEnd(tournamentId: number): Promise<void> {
    this.log('info', `Handling registration end for tournament ${tournamentId}`);
    this.tournamentTimers.delete(tournamentId);

    try {
      const tournament = await this.tournamentService.closeRegistration(tournamentId);

      if (tournament.status === 'CANCELLED') {
        this.log('info', `Tournament ${tournamentId} cancelled due to insufficient players`);
        return;
      }

      // If no startTime, start immediately
      if (!tournament.startTime) {
        await this.handleTournamentStart(tournamentId);
      } else {
        // Schedule tournament start
        this.scheduleTournamentStart(tournament);
      }
    } catch (error) {
      this.log('error', `Failed to close registration for tournament ${tournamentId}`, { error });
    }
  }

  private async handleTournamentStart(tournamentId: number): Promise<void> {
    this.log('info', `Handling tournament start for tournament ${tournamentId}`);
    this.tournamentTimers.delete(tournamentId);

    try {
      const matches = await this.tournamentService.startTournament(tournamentId);

      // Schedule deadlines for all generated matches
      for (const match of matches) {
        this.onMatchCreated(match);
      }

      this.log('info', `Tournament ${tournamentId} started with ${matches.length} matches`);
    } catch (error) {
      this.log('error', `Failed to start tournament ${tournamentId}`, { error });
    }
  }

  private async handleMatchDeadline(matchId: string): Promise<void> {
    this.log('info', `Handling match deadline for match ${matchId}`);
    this.matchTimers.delete(matchId);

    try {
      const match = await this.matchDao.findById(matchId);

      if (!match) {
        this.log('warn', `Match ${matchId} not found for deadline handling`);
        return;
      }

      // Only process if still pending
      if (match.status !== 'PENDING_ACKNOWLEDGEMENT' && match.status !== 'SCHEDULED') {
        this.log('info', `Match ${matchId} already processed, status: ${match.status}`);
        return;
      }

      // Determine forfeit based on acknowledgement status
      let winnerId: number | null = null;
      let player1Score = 0;
      let player2Score = 0;

      if (match.player1Acknowledged && !match.player2Acknowledged) {
        winnerId = match.player1Id;
        player1Score = 7;
      } else if (!match.player1Acknowledged && match.player2Acknowledged) {
        winnerId = match.player2Id;
        player2Score = 7;
      }
      // If neither or both acknowledged but match didn't complete, both forfeit (scores stay 0)

      const updatedMatch = await this.matchDao.recordTimeout(matchId, {
        winnerId,
        player1Score,
        player2Score,
        resultSource: 'timeout'
      });

      this.log('info', `Match ${matchId} timed out`, { winnerId, player1Score, player2Score });

      // If this is a tournament match, process the result
      if (updatedMatch.tournamentId) {
        await this.tournamentService.processMatchResult(updatedMatch);
      }
    } catch (error) {
      this.log('error', `Failed to handle match deadline for ${matchId}`, { error });
    }
  }

  // ============================================================================
  // Internal: Timer Management
  // ============================================================================

  private cancelTournamentTimer(tournamentId: number): void {
    const event = this.tournamentTimers.get(tournamentId);
    if (event) {
      this.timerProvider.clearTimeout(event.timer);
      this.tournamentTimers.delete(tournamentId);
    }
  }

  private cancelMatchTimer(matchId: string): void {
    const event = this.matchTimers.get(matchId);
    if (event) {
      this.timerProvider.clearTimeout(event.timer);
      this.matchTimers.delete(matchId);
    }
  }

  // ============================================================================
  // Diagnostics
  // ============================================================================

  /**
   * Get count of active timers (for monitoring)
   */
  getTimerCounts(): { tournaments: number; matches: number } {
    return {
      tournaments: this.tournamentTimers.size,
      matches: this.matchTimers.size
    };
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
      this.logger[level]({ ...meta, service: 'tournament-lifecycle' }, message);
    } else {
      console.log(`[${level.toUpperCase()}] ${message}`, meta || '');
    }
  }
}
