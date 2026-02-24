import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TournamentService, TournamentError } from '../../src/services/tournament.js';
import { TournamentDao } from '../../src/dao/tournament.js';
import { TournamentParticipantDao } from '../../src/dao/tournament-participant.js';
import { MatchDao } from '../../src/dao/match.js';

describe('TournamentService', () => {
  let service: TournamentService;
  let mockTournamentDao: TournamentDao;
  let mockParticipantDao: TournamentParticipantDao;
  let mockMatchDao: MatchDao;

  beforeEach(() => {
    vi.clearAllMocks();

    mockTournamentDao = {
      create: vi.fn(),
      findById: vi.fn(),
      findByIdWithParticipantCount: vi.fn(),
      findByStatus: vi.fn(),
      findByCreator: vi.fn(),
      findRegistrationEnding: vi.fn(),
      findReadyToStart: vi.fn(),
      findOpen: vi.fn(),
      update: vi.fn(),
      updateStatus: vi.fn(),
      delete: vi.fn(),
      countByStatus: vi.fn(),
      getParticipantCount: vi.fn(),
      hasCapacity: vi.fn(),
      hasMinimumPlayers: vi.fn(),
    } as unknown as TournamentDao;

    mockParticipantDao = {
      register: vi.fn(),
      unregister: vi.fn(),
      findByTournamentAndUser: vi.fn(),
      isRegistered: vi.fn(),
      findByTournament: vi.fn(),
      findByUser: vi.fn(),
      updateStats: vi.fn(),
      incrementWins: vi.fn(),
      incrementLosses: vi.fn(),
      setFinalRank: vi.fn(),
      getRankings: vi.fn(),
      count: vi.fn(),
      getParticipantUserIds: vi.fn(),
      findTiedParticipants: vi.fn(),
      setAllFinalRanks: vi.fn(),
    } as unknown as TournamentParticipantDao;

    mockMatchDao = {
      create: vi.fn(),
      findById: vi.fn(),
      findByPlayerId: vi.fn(),
      findByTournamentId: vi.fn(),
      findByStatus: vi.fn(),
      findUnacknowledged: vi.fn(),
      findOverdue: vi.fn(),
      updateStatus: vi.fn(),
      recordResult: vi.fn(),
      recordAcknowledgement: vi.fn(),
      handleAckForfeit: vi.fn(),
      setGameSessionId: vi.fn(),
      delete: vi.fn(),
      countByStatus: vi.fn(),
      findBetweenPlayers: vi.fn(),
      acknowledge: vi.fn(),
      completeMatch: vi.fn(),
      findActiveMatchForUser: vi.fn(),
    } as unknown as MatchDao;

    service = new TournamentService(
      mockTournamentDao,
      mockParticipantDao,
      mockMatchDao
    );
  });

  describe('createTournament', () => {
    it('should create a tournament with valid data', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      const mockTournament = {
        id: 1,
        name: 'Test Tournament',
        format: 'round_robin',
        status: 'REGISTRATION',
        createdBy: 100,
        registrationEnd: futureDate,
      };
      vi.mocked(mockTournamentDao.create).mockResolvedValueOnce(mockTournament as any);

      const result = await service.createTournament({
        name: 'Test Tournament',
        createdBy: 100,
        registrationEnd: futureDate,
      });

      expect(result).toEqual(mockTournament);
      expect(mockTournamentDao.create).toHaveBeenCalledWith({
        name: 'Test Tournament',
        createdBy: 100,
        registrationEnd: futureDate,
      });
    });

    it('should throw error if registration end is in the past', async () => {
      const pastDate = new Date(Date.now() - 3600000);

      await expect(
        service.createTournament({
          name: 'Test Tournament',
          createdBy: 100,
          registrationEnd: pastDate,
        })
      ).rejects.toThrow(TournamentError);
    });

    it('should throw error if start time is before registration end', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      const earlierDate = new Date(Date.now() + 1800000);

      await expect(
        service.createTournament({
          name: 'Test Tournament',
          createdBy: 100,
          registrationEnd: futureDate,
          startTime: earlierDate,
        })
      ).rejects.toThrow(TournamentError);
    });
  });

  describe('getTournament', () => {
    it('should return tournament by ID', async () => {
      const mockTournament = { id: 1, name: 'Test Tournament' };
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(mockTournament as any);

      const result = await service.getTournament(1);

      expect(result).toEqual(mockTournament);
      expect(mockTournamentDao.findById).toHaveBeenCalledWith(1);
    });

    it('should return null if tournament not found', async () => {
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(null);

      const result = await service.getTournament(999);

      expect(result).toBeNull();
    });
  });

  describe('cancelTournament', () => {
    it('should cancel tournament if user is creator', async () => {
      const mockTournament = {
        id: 1,
        name: 'Test Tournament',
        status: 'REGISTRATION',
        createdBy: 100,
      };
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(mockTournament as any);
      vi.mocked(mockTournamentDao.updateStatus).mockResolvedValueOnce({
        ...mockTournament,
        status: 'CANCELLED',
      } as any);

      const result = await service.cancelTournament(1, 100);

      expect(result.status).toBe('CANCELLED');
      expect(mockTournamentDao.updateStatus).toHaveBeenCalledWith(1, 'CANCELLED');
    });

    it('should throw error if user is not creator', async () => {
      const mockTournament = {
        id: 1,
        status: 'REGISTRATION',
        createdBy: 100,
      };
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(mockTournament as any);

      await expect(service.cancelTournament(1, 200)).rejects.toThrow(TournamentError);
    });

    it('should throw error if tournament is in progress', async () => {
      const mockTournament = {
        id: 1,
        status: 'IN_PROGRESS',
        createdBy: 100,
      };
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(mockTournament as any);

      await expect(service.cancelTournament(1, 100)).rejects.toThrow(TournamentError);
    });

    it('should throw error if tournament not found', async () => {
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(null);

      await expect(service.cancelTournament(999, 100)).rejects.toThrow(TournamentError);
    });
  });

  describe('register', () => {
    it('should register user for tournament', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      const mockTournament = {
        id: 1,
        status: 'REGISTRATION',
        registrationEnd: futureDate,
      };
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(mockTournament as any);
      vi.mocked(mockParticipantDao.isRegistered).mockResolvedValueOnce(false);
      vi.mocked(mockTournamentDao.hasCapacity).mockResolvedValueOnce(true);

      await service.register(1, 100);

      expect(mockParticipantDao.register).toHaveBeenCalledWith(1, 100);
    });

    it('should throw error if tournament not found', async () => {
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(null);

      await expect(service.register(999, 100)).rejects.toThrow(TournamentError);
    });

    it('should throw error if tournament is not in registration', async () => {
      const mockTournament = {
        id: 1,
        status: 'IN_PROGRESS',
      };
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(mockTournament as any);

      await expect(service.register(1, 100)).rejects.toThrow(TournamentError);
    });

    it('should throw error if registration has ended', async () => {
      const pastDate = new Date(Date.now() - 3600000);
      const mockTournament = {
        id: 1,
        status: 'REGISTRATION',
        registrationEnd: pastDate,
      };
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(mockTournament as any);

      await expect(service.register(1, 100)).rejects.toThrow(TournamentError);
    });

    it('should throw error if already registered', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      const mockTournament = {
        id: 1,
        status: 'REGISTRATION',
        registrationEnd: futureDate,
      };
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(mockTournament as any);
      vi.mocked(mockParticipantDao.isRegistered).mockResolvedValueOnce(true);

      await expect(service.register(1, 100)).rejects.toThrow(TournamentError);
    });

    it('should throw error if tournament is full', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      const mockTournament = {
        id: 1,
        status: 'REGISTRATION',
        registrationEnd: futureDate,
      };
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(mockTournament as any);
      vi.mocked(mockParticipantDao.isRegistered).mockResolvedValueOnce(false);
      vi.mocked(mockTournamentDao.hasCapacity).mockResolvedValueOnce(false);

      await expect(service.register(1, 100)).rejects.toThrow(TournamentError);
    });
  });

  describe('unregister', () => {
    it('should unregister user from tournament', async () => {
      const mockTournament = {
        id: 1,
        status: 'REGISTRATION',
      };
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(mockTournament as any);
      vi.mocked(mockParticipantDao.isRegistered).mockResolvedValueOnce(true);

      await service.unregister(1, 100);

      expect(mockParticipantDao.unregister).toHaveBeenCalledWith(1, 100);
    });

    it('should throw error if not registered', async () => {
      const mockTournament = {
        id: 1,
        status: 'REGISTRATION',
      };
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(mockTournament as any);
      vi.mocked(mockParticipantDao.isRegistered).mockResolvedValueOnce(false);

      await expect(service.unregister(1, 100)).rejects.toThrow(TournamentError);
    });

    it('should throw error if registration is closed', async () => {
      const mockTournament = {
        id: 1,
        status: 'SCHEDULED',
      };
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(mockTournament as any);

      await expect(service.unregister(1, 100)).rejects.toThrow(TournamentError);
    });
  });

  describe('closeRegistration', () => {
    it('should transition to SCHEDULED if minimum players met', async () => {
      const mockTournament = {
        id: 1,
        status: 'REGISTRATION',
      };
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(mockTournament as any);
      vi.mocked(mockTournamentDao.hasMinimumPlayers).mockResolvedValueOnce(true);
      vi.mocked(mockTournamentDao.updateStatus).mockResolvedValueOnce({
        ...mockTournament,
        status: 'SCHEDULED',
      } as any);

      const result = await service.closeRegistration(1);

      expect(result.status).toBe('SCHEDULED');
      expect(mockTournamentDao.updateStatus).toHaveBeenCalledWith(1, 'SCHEDULED');
    });

    it('should cancel tournament if not enough players', async () => {
      const mockTournament = {
        id: 1,
        status: 'REGISTRATION',
      };
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(mockTournament as any);
      vi.mocked(mockTournamentDao.hasMinimumPlayers).mockResolvedValueOnce(false);
      vi.mocked(mockTournamentDao.updateStatus).mockResolvedValueOnce({
        ...mockTournament,
        status: 'CANCELLED',
      } as any);

      const result = await service.closeRegistration(1);

      expect(result.status).toBe('CANCELLED');
      expect(mockTournamentDao.updateStatus).toHaveBeenCalledWith(1, 'CANCELLED');
    });

    it('should throw error if tournament not in registration', async () => {
      const mockTournament = {
        id: 1,
        status: 'IN_PROGRESS',
      };
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(mockTournament as any);

      await expect(service.closeRegistration(1)).rejects.toThrow(TournamentError);
    });
  });

  describe('startTournament', () => {
    it('should generate round-robin matches and start tournament', async () => {
      const mockTournament = {
        id: 1,
        status: 'SCHEDULED',
        minPlayers: 2,
        matchDeadlineMin: 30,
      };
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(mockTournament as any);
      vi.mocked(mockParticipantDao.getParticipantUserIds).mockResolvedValueOnce([100, 101, 102]);

      const mockMatch = { id: 'match-1', tournamentId: 1 };
      vi.mocked(mockMatchDao.create).mockResolvedValue(mockMatch as any);

      const usernameLookup = new Map([
        [100, 'user100'],
        [101, 'user101'],
        [102, 'user102'],
      ]);

      const matches = await service.startTournament(1, usernameLookup);

      // 3 players = 3 matches (3 * 2 / 2)
      expect(matches.length).toBe(3);
      expect(mockMatchDao.create).toHaveBeenCalledTimes(3);
      expect(mockTournamentDao.updateStatus).toHaveBeenCalledWith(1, 'IN_PROGRESS');
    });

    it('should throw error if tournament not in SCHEDULED status', async () => {
      const mockTournament = {
        id: 1,
        status: 'REGISTRATION',
      };
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(mockTournament as any);

      await expect(service.startTournament(1, new Map())).rejects.toThrow(TournamentError);
    });

    it('should throw error if not enough players', async () => {
      const mockTournament = {
        id: 1,
        status: 'SCHEDULED',
        minPlayers: 4,
      };
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(mockTournament as any);
      vi.mocked(mockParticipantDao.getParticipantUserIds).mockResolvedValueOnce([100, 101]);

      await expect(service.startTournament(1, new Map())).rejects.toThrow(TournamentError);
    });
  });

  describe('processMatchResult', () => {
    it('should update winner and loser stats', async () => {
      const mockMatch = {
        id: 'match-1',
        tournamentId: 1,
        player1Id: 100,
        player2Id: 101,
        winnerId: 100,
        player1Score: 7,
        player2Score: 3,
        status: 'COMPLETED',
      };

      vi.mocked(mockMatchDao.findByTournamentId).mockResolvedValueOnce([
        { ...mockMatch, status: 'COMPLETED' },
      ] as any);

      // Rankings called twice: once in checkForTies, once in finalizeTournament
      const mockRankings = [
        { rank: 1, userId: 100, wins: 1, losses: 0, scoreDiff: 4, matchesPlayed: 1 },
        { rank: 2, userId: 101, wins: 0, losses: 1, scoreDiff: -4, matchesPlayed: 1 },
      ];
      vi.mocked(mockParticipantDao.getRankings)
        .mockResolvedValueOnce(mockRankings)
        .mockResolvedValueOnce(mockRankings);

      await service.processMatchResult(mockMatch as any);

      expect(mockParticipantDao.incrementWins).toHaveBeenCalledWith(1, 100, 4);
      expect(mockParticipantDao.incrementLosses).toHaveBeenCalledWith(1, 101, -4);
    });

    it('should skip non-tournament matches', async () => {
      const mockMatch = {
        id: 'match-1',
        tournamentId: null, // Casual match
        player1Id: 100,
        player2Id: 101,
      };

      await service.processMatchResult(mockMatch as any);

      expect(mockParticipantDao.incrementWins).not.toHaveBeenCalled();
      expect(mockParticipantDao.incrementLosses).not.toHaveBeenCalled();
    });

    it('should handle both forfeit case', async () => {
      const mockMatch = {
        id: 'match-1',
        tournamentId: 1,
        player1Id: 100,
        player2Id: 101,
        winnerId: null, // Both forfeit
        player1Score: 0,
        player2Score: 0,
        status: 'FORFEITED',
      };

      vi.mocked(mockMatchDao.findByTournamentId).mockResolvedValueOnce([mockMatch] as any);

      // Rankings called twice: once in checkForTies, once in finalizeTournament
      vi.mocked(mockParticipantDao.getRankings)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await service.processMatchResult(mockMatch as any);

      expect(mockParticipantDao.incrementLosses).toHaveBeenCalledWith(1, 100, 0);
      expect(mockParticipantDao.incrementLosses).toHaveBeenCalledWith(1, 101, -0);
    });
  });

  describe('getRankings', () => {
    it('should return rankings for tournament', async () => {
      const mockTournament = { id: 1 };
      const mockRankings = [
        { rank: 1, userId: 100, wins: 3, losses: 0, scoreDiff: 15, matchesPlayed: 3 },
        { rank: 2, userId: 101, wins: 2, losses: 1, scoreDiff: 5, matchesPlayed: 3 },
      ];

      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(mockTournament as any);
      vi.mocked(mockParticipantDao.getRankings).mockResolvedValueOnce(mockRankings);

      const result = await service.getRankings(1);

      expect(result).toEqual(mockRankings);
    });

    it('should throw error if tournament not found', async () => {
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(null);

      await expect(service.getRankings(999)).rejects.toThrow(TournamentError);
    });
  });

  describe('getMatches', () => {
    it('should return matches for tournament', async () => {
      const mockMatches = [
        { id: 'match-1', tournamentId: 1 },
        { id: 'match-2', tournamentId: 1 },
      ];
      vi.mocked(mockMatchDao.findByTournamentId).mockResolvedValueOnce(mockMatches as any);

      const result = await service.getMatches(1);

      expect(result).toEqual(mockMatches);
      expect(mockMatchDao.findByTournamentId).toHaveBeenCalledWith(1);
    });
  });

  describe('tie-breaker logic', () => {
    it('should finalize tournament when no ties exist', async () => {
      const mockMatch = {
        id: 'match-1',
        tournamentId: 1,
        player1Id: 100,
        player2Id: 101,
        winnerId: 100,
        player1Score: 7,
        player2Score: 3,
        status: 'COMPLETED',
      };

      // All matches complete
      vi.mocked(mockMatchDao.findByTournamentId).mockResolvedValueOnce([mockMatch] as any);

      // Clear ranking difference - called twice in flow
      const mockRankings = [
        { rank: 1, userId: 100, wins: 1, losses: 0, scoreDiff: 4, matchesPlayed: 1 },
        { rank: 2, userId: 101, wins: 0, losses: 1, scoreDiff: -4, matchesPlayed: 1 },
      ];
      vi.mocked(mockParticipantDao.getRankings)
        .mockResolvedValueOnce(mockRankings)
        .mockResolvedValueOnce(mockRankings);

      await service.processMatchResult(mockMatch as any);

      expect(mockParticipantDao.setAllFinalRanks).toHaveBeenCalled();
      expect(mockTournamentDao.updateStatus).toHaveBeenCalledWith(1, 'COMPLETED');
    });

    it('should schedule golden game when players are tied after head-to-head', async () => {
      const mockMatch = {
        id: 'match-1',
        tournamentId: 1,
        player1Id: 100,
        player2Id: 101,
        winnerId: 100,
        player1Score: 7,
        player2Score: 7,
        status: 'COMPLETED',
      };

      // All matches complete
      vi.mocked(mockMatchDao.findByTournamentId).mockResolvedValueOnce([mockMatch] as any);

      // Tied rankings
      vi.mocked(mockParticipantDao.getRankings).mockResolvedValueOnce([
        { rank: 1, userId: 100, wins: 1, losses: 1, scoreDiff: 0, matchesPlayed: 2 },
        { rank: 2, userId: 101, wins: 1, losses: 1, scoreDiff: 0, matchesPlayed: 2 },
      ]);

      // Head-to-head is also tied
      vi.mocked(mockMatchDao.findBetweenPlayers).mockResolvedValueOnce([
        { player1Id: 100, player2Id: 101, player1Score: 5, player2Score: 5 },
      ] as any);

      // Mock tournament for golden game deadline
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce({
        id: 1,
        matchDeadlineMin: 30,
      } as any);

      // Golden game creation
      vi.mocked(mockMatchDao.create).mockResolvedValueOnce({
        id: 'golden-match',
        tournamentId: 1,
        isGoldenGame: true,
      } as any);

      await service.processMatchResult(mockMatch as any);

      expect(mockTournamentDao.updateStatus).toHaveBeenCalledWith(1, 'TIE_BREAKER');
      expect(mockMatchDao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tournamentId: 1,
          isGoldenGame: true,
        })
      );
    });
  });
});
