import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  TournamentLifecycleManager,
  TimerProvider
} from '../../src/services/tournament-lifecycle.js';
import { TournamentService } from '../../src/services/tournament.js';
import { TournamentDao } from '../../src/dao/tournament.js';
import { MatchDao } from '../../src/dao/match.js';
import { Tournament, Match, TournamentStatus } from '../../generated/prisma/index.js';

describe('TournamentLifecycleManager', () => {
  let manager: TournamentLifecycleManager;
  let mockTournamentService: TournamentService;
  let mockTournamentDao: TournamentDao;
  let mockMatchDao: MatchDao;
  let mockTimerProvider: TimerProvider;
  let timers: Map<number, { callback: () => void; ms: number }>;
  let timerIdCounter: number;

  const createMockTournament = (overrides: Partial<Tournament> = {}): Tournament => ({
    id: 1,
    name: 'Test Tournament',
    format: 'round_robin',
    minPlayers: 2,
    maxPlayers: 8,
    matchDeadlineMin: 30,
    tieBreaker: 'score_diff',
    createdBy: 100,
    registrationStart: new Date(),
    registrationEnd: new Date(Date.now() + 3600000), // 1 hour from now
    startTime: null,
    endTime: null,
    status: 'REGISTRATION' as TournamentStatus,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  });

  const createMockMatch = (overrides: Partial<Match> = {}): Match => ({
    id: 'match-1',
    tournamentId: 1,
    gameMode: 'classic',
    player1Id: 100,
    player2Id: 101,
    player1Username: 'user100',
    player2Username: 'user101',
    status: 'PENDING_ACKNOWLEDGEMENT',
    scheduledAt: new Date(),
    deadline: new Date(Date.now() + 1800000), // 30 min from now
    player1Acknowledged: false,
    player2Acknowledged: false,
    startedAt: null,
    completedAt: null,
    winnerId: null,
    player1Score: null,
    player2Score: null,
    gameSessionId: null,
    isGoldenGame: false,
    resultSource: null,
    ...overrides
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock timer provider that tracks timers
    timers = new Map();
    timerIdCounter = 1;

    mockTimerProvider = {
      setTimeout: vi.fn((callback: () => void, ms: number) => {
        const id = timerIdCounter++;
        timers.set(id, { callback, ms });
        return id as unknown as NodeJS.Timeout;
      }),
      clearTimeout: vi.fn((timer: NodeJS.Timeout) => {
        timers.delete(timer as unknown as number);
      })
    };

    mockTournamentService = {
      closeRegistration: vi.fn(),
      startTournament: vi.fn(),
      processMatchResult: vi.fn()
    } as unknown as TournamentService;

    mockTournamentDao = {
      findByStatus: vi.fn().mockResolvedValue([]),
      findById: vi.fn()
    } as unknown as TournamentDao;

    mockMatchDao = {
      findPendingWithDeadline: vi.fn().mockResolvedValue([]),
      findById: vi.fn(),
      update: vi.fn()
    } as unknown as MatchDao;

    manager = new TournamentLifecycleManager(
      mockTournamentService,
      mockTournamentDao,
      mockMatchDao,
      mockTimerProvider
    );
  });

  afterEach(() => {
    manager.shutdown();
  });

  describe('initialize', () => {
    it('should recover tournaments in REGISTRATION status', async () => {
      const futureTournament = createMockTournament({
        id: 1,
        registrationEnd: new Date(Date.now() + 3600000)
      });
      const pastTournament = createMockTournament({
        id: 2,
        registrationEnd: new Date(Date.now() - 1000)
      });

      vi.mocked(mockTournamentDao.findByStatus)
        .mockResolvedValueOnce([futureTournament, pastTournament]) // REGISTRATION
        .mockResolvedValueOnce([]); // SCHEDULED

      vi.mocked(mockTournamentService.closeRegistration).mockResolvedValue(
        createMockTournament({ id: 2, status: 'CANCELLED' })
      );

      await manager.initialize();

      // Future tournament should have timer scheduled
      expect(mockTimerProvider.setTimeout).toHaveBeenCalled();

      // Past tournament should have been processed immediately
      expect(mockTournamentService.closeRegistration).toHaveBeenCalledWith(2);
    });

    it('should recover tournaments in SCHEDULED status with future startTime', async () => {
      const scheduledTournament = createMockTournament({
        id: 1,
        status: 'SCHEDULED',
        startTime: new Date(Date.now() + 3600000) // 1 hour from now
      });

      vi.mocked(mockTournamentDao.findByStatus)
        .mockResolvedValueOnce([]) // REGISTRATION
        .mockResolvedValueOnce([scheduledTournament]); // SCHEDULED

      await manager.initialize();

      // Should schedule timer for start time
      expect(mockTimerProvider.setTimeout).toHaveBeenCalled();
    });

    it('should start scheduled tournaments with past startTime immediately', async () => {
      const scheduledTournament = createMockTournament({
        id: 1,
        status: 'SCHEDULED',
        startTime: new Date(Date.now() - 1000) // Already passed
      });

      vi.mocked(mockTournamentDao.findByStatus)
        .mockResolvedValueOnce([]) // REGISTRATION
        .mockResolvedValueOnce([scheduledTournament]); // SCHEDULED

      vi.mocked(mockTournamentService.startTournament).mockResolvedValue([]);

      await manager.initialize();

      expect(mockTournamentService.startTournament).toHaveBeenCalledWith(1);
    });

    it('should recover pending matches with deadlines', async () => {
      const futureMatch = createMockMatch({
        id: 'match-1',
        deadline: new Date(Date.now() + 1800000)
      });
      const pastMatch = createMockMatch({
        id: 'match-2',
        deadline: new Date(Date.now() - 1000),
        tournamentId: 1
      });

      vi.mocked(mockTournamentDao.findByStatus)
        .mockResolvedValueOnce([]) // REGISTRATION
        .mockResolvedValueOnce([]); // SCHEDULED

      vi.mocked(mockMatchDao.findPendingWithDeadline).mockResolvedValue([
        futureMatch,
        pastMatch
      ]);

      vi.mocked(mockMatchDao.findById).mockResolvedValue(pastMatch);
      vi.mocked(mockMatchDao.update).mockResolvedValue({
        ...pastMatch,
        status: 'TIMEOUT'
      });

      await manager.initialize();

      // Future match should have timer scheduled
      // Past match should be processed immediately
      expect(mockMatchDao.update).toHaveBeenCalledWith('match-2', expect.objectContaining({
        status: 'TIMEOUT'
      }));
    });
  });

  describe('onTournamentCreated', () => {
    it('should schedule registration end timer', () => {
      const tournament = createMockTournament({
        registrationEnd: new Date(Date.now() + 3600000)
      });

      manager.onTournamentCreated(tournament);

      expect(mockTimerProvider.setTimeout).toHaveBeenCalled();
      expect(manager.getTimerCounts().tournaments).toBe(1);
    });

    it('should handle immediate registration end for past deadline', async () => {
      const tournament = createMockTournament({
        registrationEnd: new Date(Date.now() - 1000) // Already passed
      });

      vi.mocked(mockTournamentService.closeRegistration).mockResolvedValue(
        createMockTournament({ status: 'SCHEDULED' })
      );
      vi.mocked(mockTournamentService.startTournament).mockResolvedValue([]);

      manager.onTournamentCreated(tournament);

      // Give async operations time to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockTournamentService.closeRegistration).toHaveBeenCalledWith(1);
    });
  });

  describe('onRegistrationFull', () => {
    it('should cancel existing timer and close registration immediately', async () => {
      const tournament = createMockTournament({
        registrationEnd: new Date(Date.now() + 3600000)
      });

      // First create a tournament with a timer
      manager.onTournamentCreated(tournament);
      expect(manager.getTimerCounts().tournaments).toBe(1);

      vi.mocked(mockTournamentService.closeRegistration).mockResolvedValue(
        createMockTournament({ status: 'SCHEDULED' })
      );
      vi.mocked(mockTournamentService.startTournament).mockResolvedValue([]);

      // Now trigger registration full
      await manager.onRegistrationFull(1);

      expect(mockTimerProvider.clearTimeout).toHaveBeenCalled();
      expect(mockTournamentService.closeRegistration).toHaveBeenCalledWith(1);
    });
  });

  describe('onTournamentCancelled', () => {
    it('should cancel pending timer', () => {
      const tournament = createMockTournament({
        registrationEnd: new Date(Date.now() + 3600000)
      });

      manager.onTournamentCreated(tournament);
      expect(manager.getTimerCounts().tournaments).toBe(1);

      manager.onTournamentCancelled(1);

      expect(mockTimerProvider.clearTimeout).toHaveBeenCalled();
      expect(manager.getTimerCounts().tournaments).toBe(0);
    });
  });

  describe('onMatchCreated', () => {
    it('should schedule deadline timer for match with deadline', () => {
      const match = createMockMatch({
        deadline: new Date(Date.now() + 1800000)
      });

      manager.onMatchCreated(match);

      expect(mockTimerProvider.setTimeout).toHaveBeenCalled();
      expect(manager.getTimerCounts().matches).toBe(1);
    });

    it('should not schedule timer for match without deadline', () => {
      const match = createMockMatch({
        deadline: null
      });

      manager.onMatchCreated(match);

      expect(mockTimerProvider.setTimeout).not.toHaveBeenCalled();
      expect(manager.getTimerCounts().matches).toBe(0);
    });
  });

  describe('onMatchCompleted', () => {
    it('should cancel pending deadline timer', () => {
      const match = createMockMatch({
        deadline: new Date(Date.now() + 1800000)
      });

      manager.onMatchCreated(match);
      expect(manager.getTimerCounts().matches).toBe(1);

      manager.onMatchCompleted('match-1');

      expect(mockTimerProvider.clearTimeout).toHaveBeenCalled();
      expect(manager.getTimerCounts().matches).toBe(0);
    });
  });

  describe('registration end handling', () => {
    it('should close registration and start tournament when no start time', async () => {
      const tournament = createMockTournament({
        registrationEnd: new Date(Date.now() + 100), // Very short delay
        startTime: null
      });

      vi.mocked(mockTournamentService.closeRegistration).mockResolvedValue(
        createMockTournament({ status: 'SCHEDULED', startTime: null })
      );
      vi.mocked(mockTournamentService.startTournament).mockResolvedValue([]);

      manager.onTournamentCreated(tournament);

      // Get the timer callback and execute it
      const timerEntry = Array.from(timers.values())[0];
      timerEntry.callback();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockTournamentService.closeRegistration).toHaveBeenCalledWith(1);
      expect(mockTournamentService.startTournament).toHaveBeenCalledWith(1);
    });

    it('should close registration and schedule start when startTime is set', async () => {
      const tournament = createMockTournament({
        registrationEnd: new Date(Date.now() + 100), // Very short delay
        startTime: null
      });

      const scheduledTournament = createMockTournament({
        status: 'SCHEDULED',
        startTime: new Date(Date.now() + 7200000) // 2 hours from now
      });

      vi.mocked(mockTournamentService.closeRegistration).mockResolvedValue(scheduledTournament);

      manager.onTournamentCreated(tournament);

      // Execute registration end timer
      const timerEntry = Array.from(timers.values())[0];
      timerEntry.callback();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockTournamentService.closeRegistration).toHaveBeenCalledWith(1);
      // Should schedule a new timer for tournament start
      expect(mockTimerProvider.setTimeout).toHaveBeenCalledTimes(2);
    });

    it('should not start tournament if cancelled due to insufficient players', async () => {
      const tournament = createMockTournament({
        registrationEnd: new Date(Date.now() + 100) // Very short delay
      });

      vi.mocked(mockTournamentService.closeRegistration).mockResolvedValue(
        createMockTournament({ status: 'CANCELLED' })
      );

      manager.onTournamentCreated(tournament);

      // Execute registration end timer
      const timerEntry = Array.from(timers.values())[0];
      timerEntry.callback();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockTournamentService.closeRegistration).toHaveBeenCalled();
      expect(mockTournamentService.startTournament).not.toHaveBeenCalled();
    });
  });

  describe('match deadline handling', () => {
    it('should timeout match and process tournament result', async () => {
      const match = createMockMatch({
        tournamentId: 1,
        deadline: new Date(Date.now() + 100)
      });

      vi.mocked(mockMatchDao.findById).mockResolvedValue(match);
      vi.mocked(mockMatchDao.update).mockResolvedValue({
        ...match,
        status: 'TIMEOUT',
        winnerId: null
      });

      manager.onMatchCreated(match);

      // Execute deadline timer
      const timerEntry = Array.from(timers.values())[0];
      timerEntry.callback();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockMatchDao.update).toHaveBeenCalledWith('match-1', expect.objectContaining({
        status: 'TIMEOUT',
        winnerId: null,
        resultSource: 'timeout'
      }));
      expect(mockTournamentService.processMatchResult).toHaveBeenCalled();
    });

    it('should award win to acknowledged player when only one acknowledged', async () => {
      const match = createMockMatch({
        player1Acknowledged: true,
        player2Acknowledged: false,
        deadline: new Date(Date.now() + 100)
      });

      vi.mocked(mockMatchDao.findById).mockResolvedValue(match);
      vi.mocked(mockMatchDao.update).mockResolvedValue({
        ...match,
        status: 'TIMEOUT',
        winnerId: 100
      });

      manager.onMatchCreated(match);

      // Execute deadline timer
      const timerEntry = Array.from(timers.values())[0];
      timerEntry.callback();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockMatchDao.update).toHaveBeenCalledWith('match-1', expect.objectContaining({
        status: 'TIMEOUT',
        winnerId: 100
      }));
    });

    it('should not process already completed match', async () => {
      const match = createMockMatch({
        status: 'COMPLETED',
        deadline: new Date(Date.now() + 100)
      });

      vi.mocked(mockMatchDao.findById).mockResolvedValue(match);

      manager.onMatchCreated(match);

      // Execute deadline timer
      const timerEntry = Array.from(timers.values())[0];
      timerEntry.callback();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockMatchDao.update).not.toHaveBeenCalled();
    });

    it('should not process tournament result for casual match', async () => {
      const match = createMockMatch({
        tournamentId: null,
        deadline: new Date(Date.now() + 100)
      });

      vi.mocked(mockMatchDao.findById).mockResolvedValue(match);
      vi.mocked(mockMatchDao.update).mockResolvedValue({
        ...match,
        status: 'TIMEOUT'
      });

      manager.onMatchCreated(match);

      // Execute deadline timer
      const timerEntry = Array.from(timers.values())[0];
      timerEntry.callback();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockMatchDao.update).toHaveBeenCalled();
      expect(mockTournamentService.processMatchResult).not.toHaveBeenCalled();
    });
  });

  describe('shutdown', () => {
    it('should cancel all pending timers', () => {
      const tournament = createMockTournament({
        registrationEnd: new Date(Date.now() + 3600000)
      });
      const match = createMockMatch({
        deadline: new Date(Date.now() + 1800000)
      });

      manager.onTournamentCreated(tournament);
      manager.onMatchCreated(match);

      expect(manager.getTimerCounts()).toEqual({ tournaments: 1, matches: 1 });

      manager.shutdown();

      expect(mockTimerProvider.clearTimeout).toHaveBeenCalledTimes(2);
      expect(manager.getTimerCounts()).toEqual({ tournaments: 0, matches: 0 });
    });
  });

  describe('getTimerCounts', () => {
    it('should return correct counts', () => {
      expect(manager.getTimerCounts()).toEqual({ tournaments: 0, matches: 0 });

      const tournament = createMockTournament({
        registrationEnd: new Date(Date.now() + 3600000)
      });
      manager.onTournamentCreated(tournament);

      expect(manager.getTimerCounts()).toEqual({ tournaments: 1, matches: 0 });

      const match = createMockMatch({
        deadline: new Date(Date.now() + 1800000)
      });
      manager.onMatchCreated(match);

      expect(manager.getTimerCounts()).toEqual({ tournaments: 1, matches: 1 });
    });
  });
});
