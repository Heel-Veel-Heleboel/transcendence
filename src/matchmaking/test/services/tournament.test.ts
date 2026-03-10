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
      getActiveTournament: vi.fn(),
      findByTournament: vi.fn(),
      findByUser: vi.fn(),
      setSeed: vi.fn(),
      eliminate: vi.fn(),
      setFinalRank: vi.fn(),
      getRankings: vi.fn(),
      count: vi.fn(),
      getParticipantUserIds: vi.fn(),
      getParticipantsWithUsernames: vi.fn(),
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
      setGameSessionId: vi.fn(),
      delete: vi.fn(),
      countByStatus: vi.fn(),
      acknowledge: vi.fn(),
      completeMatch: vi.fn(),
      cancelMatch: vi.fn(),
      findActiveMatchForUser: vi.fn(),
      findNextQueuedMatch: vi.fn(),
      findAllQueuedMatches: vi.fn(),
      activateMatch: vi.fn(),
      resetToPendingAck: vi.fn(),
      findCompletedInRound: vi.fn(),
      countInRound: vi.fn(),
      recordTimeout: vi.fn(),
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
        gameMode: 'classic',
        status: 'REGISTRATION',
        createdBy: 100,
        registrationEnd: futureDate,
      };
      vi.mocked(mockParticipantDao.getActiveTournament).mockResolvedValueOnce(null);
      vi.mocked(mockTournamentDao.create).mockResolvedValueOnce(mockTournament as any);

      const result = await service.createTournament({
        name: 'Test Tournament',
        createdBy: 100,
        creatorUsername: 'creator',
        registrationEnd: futureDate,
      });

      expect(result).toEqual(mockTournament);
      expect(mockTournamentDao.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test Tournament',
        createdBy: 100,
      }));
      expect(mockParticipantDao.register).toHaveBeenCalledWith(1, 100, 'creator');
    });

    it('should throw error if user is already in an active tournament', async () => {
      vi.mocked(mockParticipantDao.getActiveTournament).mockResolvedValueOnce({
        tournamentId: 5, createdBy: 100
      });

      const error = await service.createTournament({
        name: 'Another Tournament',
        createdBy: 100,
        creatorUsername: 'creator',
        registrationEnd: new Date(Date.now() + 3600000),
      }).catch(e => e);

      expect(error).toBeInstanceOf(TournamentError);
      expect(error.code).toBe('ALREADY_IN_TOURNAMENT');
      expect(mockTournamentDao.create).not.toHaveBeenCalled();
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
        maxPlayers: 8,
      };
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(mockTournament as any);
      vi.mocked(mockParticipantDao.isRegistered).mockResolvedValueOnce(false);
      vi.mocked(mockParticipantDao.getActiveTournament).mockResolvedValueOnce(null);
      vi.mocked(mockTournamentDao.hasCapacity).mockResolvedValueOnce(true);
      vi.mocked(mockParticipantDao.count).mockResolvedValueOnce(3);

      const result = await service.register(1, 100, 'testuser');

      expect(mockParticipantDao.register).toHaveBeenCalledWith(1, 100, 'testuser');
      expect(result.full).toBe(false);
    });

    it('should return full=true when tournament reaches max capacity', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      const mockTournament = {
        id: 1,
        status: 'REGISTRATION',
        registrationEnd: futureDate,
        maxPlayers: 4,
      };
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(mockTournament as any);
      vi.mocked(mockParticipantDao.isRegistered).mockResolvedValueOnce(false);
      vi.mocked(mockParticipantDao.getActiveTournament).mockResolvedValueOnce(null);
      vi.mocked(mockTournamentDao.hasCapacity).mockResolvedValueOnce(true);
      vi.mocked(mockParticipantDao.count).mockResolvedValueOnce(4);

      const result = await service.register(1, 100, 'testuser');

      expect(result.full).toBe(true);
    });

    it('should throw error if tournament not found', async () => {
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(null);

      await expect(service.register(999, 100, 'testuser')).rejects.toThrow(TournamentError);
    });

    it('should throw error if tournament is not in registration', async () => {
      const mockTournament = {
        id: 1,
        status: 'IN_PROGRESS',
      };
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(mockTournament as any);

      await expect(service.register(1, 100, 'testuser')).rejects.toThrow(TournamentError);
    });

    it('should throw error if registration has ended', async () => {
      const pastDate = new Date(Date.now() - 3600000);
      const mockTournament = {
        id: 1,
        status: 'REGISTRATION',
        registrationEnd: pastDate,
      };
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(mockTournament as any);

      await expect(service.register(1, 100, 'testuser')).rejects.toThrow(TournamentError);
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

      await expect(service.register(1, 100, 'testuser')).rejects.toThrow(TournamentError);
    });

    it('should throw error if already in an active tournament', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      const mockTournament = {
        id: 1,
        status: 'REGISTRATION',
        registrationEnd: futureDate,
      };
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(mockTournament as any);
      vi.mocked(mockParticipantDao.isRegistered).mockResolvedValueOnce(false);
      vi.mocked(mockParticipantDao.getActiveTournament).mockResolvedValueOnce({
        tournamentId: 5, createdBy: 200
      });

      const error = await service.register(1, 100, 'testuser').catch(e => e);
      expect(error).toBeInstanceOf(TournamentError);
      expect(error.message).toBe('Already in an active tournament');
      expect(error.code).toBe('ALREADY_IN_TOURNAMENT');
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
      vi.mocked(mockParticipantDao.getActiveTournament).mockResolvedValueOnce(null);
      vi.mocked(mockTournamentDao.hasCapacity).mockResolvedValueOnce(false);

      await expect(service.register(1, 100, 'testuser')).rejects.toThrow(TournamentError);
    });

    it('should unregister and throw if race condition causes over-capacity', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      const mockTournament = {
        id: 1,
        status: 'REGISTRATION',
        registrationEnd: futureDate,
        maxPlayers: 4,
      };
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(mockTournament as any);
      vi.mocked(mockParticipantDao.isRegistered).mockResolvedValueOnce(false);
      vi.mocked(mockParticipantDao.getActiveTournament).mockResolvedValueOnce(null);
      vi.mocked(mockTournamentDao.hasCapacity).mockResolvedValueOnce(true);
      vi.mocked(mockParticipantDao.count).mockResolvedValueOnce(5); // Over max

      await expect(service.register(1, 100, 'testuser')).rejects.toThrow(TournamentError);
      expect(mockParticipantDao.unregister).toHaveBeenCalledWith(1, 100);
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
    it('should generate knockout bracket and return all activated matches', async () => {
      const mockTournament = {
        id: 1,
        status: 'SCHEDULED',
        minPlayers: 2,
        ackDeadlineMin: 20,
      };
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(mockTournament as any);
      vi.mocked(mockParticipantDao.getParticipantsWithUsernames).mockResolvedValueOnce([
        { userId: 100, username: 'user100' },
        { userId: 101, username: 'user101' },
        { userId: 102, username: 'user102' },
        { userId: 103, username: 'user103' },
      ]);

      const mockMatch = { id: 'match-1', tournamentId: 1, round: 1, bracketPosition: 0 };
      vi.mocked(mockMatchDao.create).mockResolvedValue(mockMatch as any);

      const result = await service.startTournament(1);

      // 4 players = 2 matches in round 1
      expect(mockMatchDao.create).toHaveBeenCalledTimes(2);
      expect(mockTournamentDao.updateStatus).toHaveBeenCalledWith(1, 'IN_PROGRESS');
      expect(mockTournamentDao.update).toHaveBeenCalledWith(1, { totalRounds: 2 });
      // Seeds assigned for all 4 players
      expect(mockParticipantDao.setSeed).toHaveBeenCalledTimes(4);
      // Returns all round 1 matches
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockMatch);
    });

    it('should handle byes for non-power-of-2 player counts', async () => {
      const mockTournament = {
        id: 1,
        status: 'SCHEDULED',
        minPlayers: 2,
        ackDeadlineMin: 20,
      };
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(mockTournament as any);
      vi.mocked(mockParticipantDao.getParticipantsWithUsernames).mockResolvedValueOnce([
        { userId: 100, username: 'user100' },
        { userId: 101, username: 'user101' },
        { userId: 102, username: 'user102' },
      ]);

      const mockMatch = { id: 'match-1', tournamentId: 1, round: 1 };
      vi.mocked(mockMatchDao.create).mockResolvedValue(mockMatch as any);

      await service.startTournament(1);

      // 3 players, bracket size 4 → 1 bye, 1 match in round 1
      expect(mockMatchDao.create).toHaveBeenCalledTimes(1);
      expect(mockTournamentDao.update).toHaveBeenCalledWith(1, { totalRounds: 2 });
    });

    it('should set deadline on all round 1 matches', async () => {
      const mockTournament = {
        id: 1,
        status: 'SCHEDULED',
        minPlayers: 2,
        ackDeadlineMin: 20,
      };
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(mockTournament as any);
      vi.mocked(mockParticipantDao.getParticipantsWithUsernames).mockResolvedValueOnce([
        { userId: 100, username: 'user100' },
        { userId: 101, username: 'user101' },
        { userId: 102, username: 'user102' },
        { userId: 103, username: 'user103' },
      ]);

      const mockMatch = { id: 'match-1', tournamentId: 1 };
      vi.mocked(mockMatchDao.create).mockResolvedValue(mockMatch as any);

      await service.startTournament(1);

      const createCalls = vi.mocked(mockMatchDao.create).mock.calls;
      // All matches should have a deadline
      expect(createCalls[0][0].deadline).toBeInstanceOf(Date);
      expect(createCalls[1][0].deadline).toBeInstanceOf(Date);
    });

    it('should revert to SCHEDULED if bracket generation fails', async () => {
      const mockTournament = {
        id: 1,
        status: 'SCHEDULED',
        minPlayers: 2,
        ackDeadlineMin: 20,
      };
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(mockTournament as any);
      vi.mocked(mockParticipantDao.getParticipantsWithUsernames).mockResolvedValueOnce([
        { userId: 100, username: 'user100' },
        { userId: 101, username: 'user101' },
      ]);
      vi.mocked(mockParticipantDao.setSeed).mockRejectedValueOnce(new Error('DB error'));

      await expect(service.startTournament(1)).rejects.toThrow('DB error');

      // Should have set IN_PROGRESS then reverted to SCHEDULED
      expect(mockTournamentDao.updateStatus).toHaveBeenCalledWith(1, 'IN_PROGRESS');
      expect(mockTournamentDao.updateStatus).toHaveBeenCalledWith(1, 'SCHEDULED');
    });

    it('should throw error if tournament not in SCHEDULED status', async () => {
      const mockTournament = {
        id: 1,
        status: 'REGISTRATION',
      };
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(mockTournament as any);

      await expect(service.startTournament(1)).rejects.toThrow(TournamentError);
    });

    it('should throw error if not enough players', async () => {
      const mockTournament = {
        id: 1,
        status: 'SCHEDULED',
        minPlayers: 4,
        ackDeadlineMin: 20,
      };
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(mockTournament as any);
      vi.mocked(mockParticipantDao.getParticipantsWithUsernames).mockResolvedValueOnce([
        { userId: 100, username: 'user100' },
        { userId: 101, username: 'user101' },
      ]);

      await expect(service.startTournament(1)).rejects.toThrow(TournamentError);
    });
  });

  describe('activateRoundMatches', () => {
    it('should activate all queued matches for the next round', async () => {
      const mockTournament = { id: 1, ackDeadlineMin: 20 };
      const queuedMatches = [
        { id: 'match-2', tournamentId: 1, round: 2, bracketPosition: 0 },
        { id: 'match-3', tournamentId: 1, round: 2, bracketPosition: 1 }
      ];

      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(mockTournament as any);
      vi.mocked(mockMatchDao.findAllQueuedMatches).mockResolvedValueOnce(queuedMatches as any);
      vi.mocked(mockMatchDao.activateMatch)
        .mockResolvedValueOnce({ ...queuedMatches[0], deadline: new Date() } as any)
        .mockResolvedValueOnce({ ...queuedMatches[1], deadline: new Date() } as any);

      const result = await service.activateRoundMatches(1);

      expect(result).toHaveLength(2);
      expect(mockMatchDao.activateMatch).toHaveBeenCalledTimes(2);
    });

    it('should return empty array when no queued matches remain', async () => {
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce({ id: 1, ackDeadlineMin: 20 } as any);
      vi.mocked(mockMatchDao.findAllQueuedMatches).mockResolvedValueOnce([]);

      const result = await service.activateRoundMatches(1);

      expect(result).toEqual([]);
    });

    it('should return empty array if tournament not found', async () => {
      vi.mocked(mockTournamentDao.findById).mockResolvedValueOnce(null);

      const result = await service.activateRoundMatches(999);

      expect(result).toEqual([]);
    });
  });

  describe('processMatchResult', () => {
    it('should eliminate the loser', async () => {
      const match = {
        id: 'match-1',
        tournamentId: 1,
        round: 1,
        player1Id: 100,
        player2Id: 101,
        player1Username: 'user100',
        player2Username: 'user101',
        winnerId: 100,
        status: 'COMPLETED',
      };

      vi.mocked(mockMatchDao.countInRound).mockResolvedValueOnce(2);
      vi.mocked(mockMatchDao.findCompletedInRound).mockResolvedValueOnce([match] as any);

      await service.processMatchResult(match as any);

      expect(mockParticipantDao.eliminate).toHaveBeenCalledWith(1, 101, 1);
    });

    it('should eliminate both players on double forfeit (no winnerId)', async () => {
      const match = {
        id: 'match-1',
        tournamentId: 1,
        round: 1,
        player1Id: 100,
        player2Id: 101,
        winnerId: null,
        status: 'FORFEITED',
      };

      vi.mocked(mockMatchDao.countInRound).mockResolvedValueOnce(2);
      vi.mocked(mockMatchDao.findCompletedInRound).mockResolvedValueOnce([match] as any);

      await service.processMatchResult(match as any);

      expect(mockParticipantDao.eliminate).toHaveBeenCalledWith(1, 100, 1);
      expect(mockParticipantDao.eliminate).toHaveBeenCalledWith(1, 101, 1);
    });

    it('should skip non-tournament matches', async () => {
      const match = {
        id: 'match-1',
        tournamentId: null,
        round: null,
        player1Id: 100,
        player2Id: 101,
      };

      await service.processMatchResult(match as any);

      expect(mockParticipantDao.eliminate).not.toHaveBeenCalled();
    });

    it('should not advance round if matches remain in current round', async () => {
      const match = {
        id: 'match-1',
        tournamentId: 1,
        round: 1,
        player1Id: 100,
        player2Id: 101,
        winnerId: 100,
        player1Username: 'user100',
        player2Username: 'user101',
        status: 'COMPLETED',
      };

      // 2 matches in round, only 1 completed
      vi.mocked(mockMatchDao.countInRound).mockResolvedValueOnce(2);
      vi.mocked(mockMatchDao.findCompletedInRound).mockResolvedValueOnce([match] as any);

      await service.processMatchResult(match as any);

      // Should not create next round matches
      expect(mockMatchDao.create).not.toHaveBeenCalled();
    });

    it('should advance to next round when all matches in round are done', async () => {
      const match1 = {
        id: 'match-1',
        tournamentId: 1,
        round: 1,
        bracketPosition: 0,
        player1Id: 100,
        player2Id: 101,
        player1Username: 'user100',
        player2Username: 'user101',
        winnerId: 100,
        status: 'COMPLETED',
      };
      const match2 = {
        id: 'match-2',
        tournamentId: 1,
        round: 1,
        bracketPosition: 1,
        player1Id: 102,
        player2Id: 103,
        player1Username: 'user102',
        player2Username: 'user103',
        winnerId: 103,
        status: 'COMPLETED',
      };

      // All 2 matches in round completed
      vi.mocked(mockMatchDao.countInRound).mockResolvedValueOnce(2);
      vi.mocked(mockMatchDao.findCompletedInRound).mockResolvedValueOnce([match1, match2] as any);

      // Round 1 complete → advanceToNextRound checks for bye players
      vi.mocked(mockParticipantDao.findByTournament).mockResolvedValueOnce([
        { userId: 100, username: 'user100', tournamentId: 1, seed: 1, eliminatedIn: null },
        { userId: 101, username: 'user101', tournamentId: 1, seed: 2, eliminatedIn: 1 },
        { userId: 102, username: 'user102', tournamentId: 1, seed: 3, eliminatedIn: 1 },
        { userId: 103, username: 'user103', tournamentId: 1, seed: 4, eliminatedIn: null },
      ] as any);

      await service.processMatchResult(match2 as any);

      // Should create 1 match in round 2 (winners: 100 vs 103)
      expect(mockMatchDao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tournamentId: 1,
          round: 2,
          bracketPosition: 0,
          player1Id: 100,
          player2Id: 103,
        })
      );
    });

    it('should include bye players when advancing from round 1', async () => {
      const match1 = {
        id: 'match-1',
        tournamentId: 1,
        round: 1,
        bracketPosition: 0,
        player1Id: 101,
        player2Id: 102,
        player1Username: 'user101',
        player2Username: 'user102',
        winnerId: 101,
        status: 'COMPLETED',
      };

      vi.mocked(mockMatchDao.countInRound).mockResolvedValueOnce(1);
      vi.mocked(mockMatchDao.findCompletedInRound).mockResolvedValueOnce([match1] as any);

      // Bye player (userId 100) wasn't in any round 1 match
      vi.mocked(mockParticipantDao.findByTournament).mockResolvedValueOnce([
        { userId: 100, username: 'user100', tournamentId: 1, registeredAt: new Date(), seed: 1, eliminatedIn: null, finalRank: null, id: 1 },
        { userId: 101, username: 'user101', tournamentId: 1, registeredAt: new Date(), seed: 2, eliminatedIn: null, finalRank: null, id: 2 },
        { userId: 102, username: 'user102', tournamentId: 1, registeredAt: new Date(), seed: 3, eliminatedIn: 1, finalRank: null, id: 3 },
      ] as any);

      await service.processMatchResult(match1 as any);

      // Round 2: bye player (100) vs round 1 winner (101)
      expect(mockMatchDao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          round: 2,
          player1Id: 100,
          player2Id: 101,
        })
      );
    });

    it('should carry bye player forward after double forfeit creates odd winner count', async () => {
      // Round 1 had 4 matches (8 players). Round 2 has 4 winners.
      // In round 2: match1 has a winner, match2 is a double forfeit → 1 winner + 0 = odd.
      // Round 2 match results:
      const match2a = {
        id: 'match-2a',
        tournamentId: 1,
        round: 2,
        bracketPosition: 0,
        player1Id: 100,
        player2Id: 101,
        player1Username: 'user100',
        player2Username: 'user101',
        winnerId: 100,
        status: 'COMPLETED',
      };
      const match2b = {
        id: 'match-2b',
        tournamentId: 1,
        round: 2,
        bracketPosition: 1,
        player1Id: 102,
        player2Id: 103,
        player1Username: 'user102',
        player2Username: 'user103',
        winnerId: null, // double forfeit
        status: 'FORFEITED',
      };

      // All 2 matches in round 2 completed
      vi.mocked(mockMatchDao.countInRound).mockResolvedValueOnce(2);
      vi.mocked(mockMatchDao.findCompletedInRound).mockResolvedValueOnce([match2a, match2b] as any);

      const participants = [
        { userId: 100, username: 'user100', tournamentId: 1, seed: 1, eliminatedIn: null, finalRank: null },
        { userId: 101, username: 'user101', tournamentId: 1, seed: 2, eliminatedIn: 2, finalRank: null },
        { userId: 102, username: 'user102', tournamentId: 1, seed: 3, eliminatedIn: 2, finalRank: null },
        { userId: 103, username: 'user103', tournamentId: 1, seed: 4, eliminatedIn: 2, finalRank: null },
      ];
      // Called once in advanceToNextRound, once in finalizeTournament
      vi.mocked(mockParticipantDao.findByTournament)
        .mockResolvedValueOnce(participants as any)
        .mockResolvedValueOnce(participants as any);

      await service.processMatchResult(match2b as any);

      // Only 1 advancing player (user 100) → tournament should finalize
      expect(mockParticipantDao.setAllFinalRanks).toHaveBeenCalled();
      expect(mockTournamentDao.updateStatus).toHaveBeenCalledWith(1, 'COMPLETED');
    });

    it('should pair bye player with winner in next round after odd advancement', async () => {
      // 3 players advance to round 2 (e.g. from 6-player bracket: 2 round-1 winners + 1 bye)
      // Round 2: match between 2 of them, 1 gets bye
      // After round 2 match completes, round 3 should pair the bye player with the winner
      const match2 = {
        id: 'match-r2',
        tournamentId: 1,
        round: 2,
        bracketPosition: 0,
        player1Id: 101,
        player2Id: 102,
        player1Username: 'user101',
        player2Username: 'user102',
        winnerId: 101,
        status: 'COMPLETED',
      };

      vi.mocked(mockMatchDao.countInRound).mockResolvedValueOnce(1);
      vi.mocked(mockMatchDao.findCompletedInRound).mockResolvedValueOnce([match2] as any);

      // Player 100 had a bye in round 2 (not in any round 2 match, not eliminated)
      vi.mocked(mockParticipantDao.findByTournament).mockResolvedValueOnce([
        { userId: 100, username: 'user100', tournamentId: 1, seed: 1, eliminatedIn: null, finalRank: null },
        { userId: 101, username: 'user101', tournamentId: 1, seed: 2, eliminatedIn: null, finalRank: null },
        { userId: 102, username: 'user102', tournamentId: 1, seed: 3, eliminatedIn: 2, finalRank: null },
      ] as any);

      await service.processMatchResult(match2 as any);

      // Round 3 should pair bye player (100) with round 2 winner (101)
      expect(mockMatchDao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          round: 3,
          player1Id: 100,
          player2Id: 101,
        })
      );
    });

    it('should finalize tournament when only one player remains', async () => {
      const finalMatch = {
        id: 'match-final',
        tournamentId: 1,
        round: 2,
        bracketPosition: 0,
        player1Id: 100,
        player2Id: 103,
        player1Username: 'user100',
        player2Username: 'user103',
        winnerId: 100,
        status: 'COMPLETED',
      };

      vi.mocked(mockMatchDao.countInRound).mockResolvedValueOnce(1);
      vi.mocked(mockMatchDao.findCompletedInRound).mockResolvedValueOnce([finalMatch] as any);

      // Only 1 winner → tournament is done
      // Called once in advanceToNextRound, once in finalizeTournament
      const participants = [
        { userId: 100, eliminatedIn: null },
        { userId: 103, eliminatedIn: 2 },
        { userId: 101, eliminatedIn: 1 },
        { userId: 102, eliminatedIn: 1 },
      ];
      vi.mocked(mockParticipantDao.findByTournament)
        .mockResolvedValueOnce(participants as any)
        .mockResolvedValueOnce(participants as any);

      await service.processMatchResult(finalMatch as any);

      expect(mockParticipantDao.setAllFinalRanks).toHaveBeenCalled();
      expect(mockTournamentDao.updateStatus).toHaveBeenCalledWith(1, 'COMPLETED');
    });
  });

  describe('getRankings', () => {
    it('should return rankings for tournament', async () => {
      const mockTournament = { id: 1 };
      const mockRankings = [
        { rank: 1, userId: 100, username: 'user100', seed: 1, eliminatedIn: null },
        { rank: 2, userId: 101, username: 'user101', seed: 2, eliminatedIn: 2 },
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
});
