import { TournamentDao } from '../../src/dao/tournament.js';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockPrismaClient = {
  tournament: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  tournamentParticipant: {
    count: vi.fn(),
  },
};

describe('TournamentDao', () => {
  let dao: TournamentDao;

  beforeEach(() => {
    vi.clearAllMocks();
    dao = new TournamentDao(mockPrismaClient as any);
  });

  describe('create', () => {
    it('should create a tournament with default values', async () => {
      const registrationEnd = new Date('2026-01-15T12:00:00Z');
      const mockTournament = {
        id: 1,
        name: 'Test Tournament',
        format: 'round_robin',
        minPlayers: 2,
        maxPlayers: 8,
        matchDeadlineMin: 30,
        createdBy: 100,
        registrationEnd,
        startTime: null,
        status: 'REGISTRATION',
      };
      mockPrismaClient.tournament.create.mockResolvedValueOnce(mockTournament);

      const result = await dao.create({
        name: 'Test Tournament',
        createdBy: 100,
        registrationEnd,
      });

      expect(mockPrismaClient.tournament.create).toBeCalledWith({
        data: {
          name: 'Test Tournament',
          format: 'round_robin',
          minPlayers: 2,
          maxPlayers: 8,
          matchDeadlineMin: 30,
          createdBy: 100,
          registrationEnd,
          startTime: null,
          status: 'REGISTRATION',
        },
      });
      expect(result).toEqual(mockTournament);
    });

    it('should create a tournament with custom values', async () => {
      const registrationEnd = new Date('2026-01-15T12:00:00Z');
      const startTime = new Date('2026-01-15T14:00:00Z');
      const mockTournament = {
        id: 1,
        name: 'Custom Tournament',
        format: 'single_elimination',
        minPlayers: 4,
        maxPlayers: 16,
        matchDeadlineMin: 60,
        createdBy: 100,
        registrationEnd,
        startTime,
        status: 'REGISTRATION',
      };
      mockPrismaClient.tournament.create.mockResolvedValueOnce(mockTournament);

      const result = await dao.create({
        name: 'Custom Tournament',
        format: 'single_elimination',
        minPlayers: 4,
        maxPlayers: 16,
        matchDeadlineMin: 60,
        createdBy: 100,
        registrationEnd,
        startTime,
      });

      expect(mockPrismaClient.tournament.create).toBeCalledWith({
        data: {
          name: 'Custom Tournament',
          format: 'single_elimination',
          minPlayers: 4,
          maxPlayers: 16,
          matchDeadlineMin: 60,
          createdBy: 100,
          registrationEnd,
          startTime,
          status: 'REGISTRATION',
        },
      });
      expect(result).toEqual(mockTournament);
    });
  });

  describe('findById', () => {
    it('should find a tournament by ID', async () => {
      const mockTournament = {
        id: 1,
        name: 'Test Tournament',
        status: 'REGISTRATION',
      };
      mockPrismaClient.tournament.findUnique.mockResolvedValueOnce(mockTournament);

      const result = await dao.findById(1);

      expect(mockPrismaClient.tournament.findUnique).toBeCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockTournament);
    });

    it('should return null if tournament not found', async () => {
      mockPrismaClient.tournament.findUnique.mockResolvedValueOnce(null);

      const result = await dao.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByIdWithParticipantCount', () => {
    it('should find tournament with participant count', async () => {
      const mockTournament = {
        id: 1,
        name: 'Test Tournament',
        format: 'round_robin',
        status: 'REGISTRATION',
        minPlayers: 2,
        maxPlayers: 8,
        registrationEnd: new Date('2026-01-15T12:00:00Z'),
        startTime: null,
        createdBy: 100,
        createdAt: new Date(),
        _count: { participants: 5 },
      };
      mockPrismaClient.tournament.findUnique.mockResolvedValueOnce(mockTournament);

      const result = await dao.findByIdWithParticipantCount(1);

      expect(mockPrismaClient.tournament.findUnique).toBeCalledWith({
        where: { id: 1 },
        include: {
          _count: {
            select: { participants: true },
          },
        },
      });
      expect(result).toEqual({
        id: 1,
        name: 'Test Tournament',
        format: 'round_robin',
        status: 'REGISTRATION',
        minPlayers: 2,
        maxPlayers: 8,
        participantCount: 5,
        registrationEnd: mockTournament.registrationEnd,
        startTime: null,
        createdBy: 100,
        createdAt: mockTournament.createdAt,
      });
    });

    it('should return null if tournament not found', async () => {
      mockPrismaClient.tournament.findUnique.mockResolvedValueOnce(null);

      const result = await dao.findByIdWithParticipantCount(999);

      expect(result).toBeNull();
    });
  });

  describe('findByStatus', () => {
    it('should find tournaments by status', async () => {
      const mockTournaments = [
        { id: 1, name: 'Tournament 1', status: 'REGISTRATION' },
        { id: 2, name: 'Tournament 2', status: 'REGISTRATION' },
      ];
      mockPrismaClient.tournament.findMany.mockResolvedValueOnce(mockTournaments);

      const result = await dao.findByStatus('REGISTRATION');

      expect(mockPrismaClient.tournament.findMany).toBeCalledWith({
        where: { status: 'REGISTRATION' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockTournaments);
    });
  });

  describe('findByCreator', () => {
    it('should find tournaments created by a user', async () => {
      const mockTournaments = [
        { id: 1, name: 'My Tournament', createdBy: 100 },
      ];
      mockPrismaClient.tournament.findMany.mockResolvedValueOnce(mockTournaments);

      const result = await dao.findByCreator(100);

      expect(mockPrismaClient.tournament.findMany).toBeCalledWith({
        where: { createdBy: 100 },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockTournaments);
    });
  });

  describe('findRegistrationEnding', () => {
    it('should find tournaments with registration ending before date', async () => {
      const deadline = new Date('2026-01-15T12:00:00Z');
      const mockTournaments = [
        { id: 1, registrationEnd: new Date('2026-01-15T11:00:00Z') },
      ];
      mockPrismaClient.tournament.findMany.mockResolvedValueOnce(mockTournaments);

      const result = await dao.findRegistrationEnding(deadline);

      expect(mockPrismaClient.tournament.findMany).toBeCalledWith({
        where: {
          status: 'REGISTRATION',
          registrationEnd: { lte: deadline },
        },
        orderBy: { registrationEnd: 'asc' },
      });
      expect(result).toEqual(mockTournaments);
    });
  });

  describe('findReadyToStart', () => {
    it('should find scheduled tournaments ready to start', async () => {
      const now = new Date('2026-01-15T14:00:00Z');
      const mockTournaments = [
        { id: 1, status: 'SCHEDULED', startTime: new Date('2026-01-15T13:00:00Z') },
      ];
      mockPrismaClient.tournament.findMany.mockResolvedValueOnce(mockTournaments);

      const result = await dao.findReadyToStart(now);

      expect(mockPrismaClient.tournament.findMany).toBeCalledWith({
        where: {
          status: 'SCHEDULED',
          startTime: { lte: now },
        },
        orderBy: { startTime: 'asc' },
      });
      expect(result).toEqual(mockTournaments);
    });
  });

  describe('findOpen', () => {
    it('should find open tournaments with participant counts', async () => {
      const now = new Date();
      vi.setSystemTime(now);

      const mockTournaments = [
        {
          id: 1,
          name: 'Open Tournament',
          format: 'round_robin',
          status: 'REGISTRATION',
          minPlayers: 2,
          maxPlayers: 8,
          registrationEnd: new Date(now.getTime() + 3600000),
          startTime: null,
          createdBy: 100,
          createdAt: new Date(),
          _count: { participants: 3 },
        },
      ];
      mockPrismaClient.tournament.findMany.mockResolvedValueOnce(mockTournaments);

      const result = await dao.findOpen();

      expect(mockPrismaClient.tournament.findMany).toBeCalledWith({
        where: {
          status: 'REGISTRATION',
          registrationEnd: { gt: expect.any(Date) },
        },
        include: {
          _count: {
            select: { participants: true },
          },
        },
        orderBy: { registrationEnd: 'asc' },
      });
      expect(result[0].participantCount).toBe(3);

      vi.useRealTimers();
    });
  });

  describe('update', () => {
    it('should update tournament fields', async () => {
      const mockTournament = {
        id: 1,
        name: 'Updated Name',
      };
      mockPrismaClient.tournament.update.mockResolvedValueOnce(mockTournament);

      const result = await dao.update(1, { name: 'Updated Name' });

      expect(mockPrismaClient.tournament.update).toBeCalledWith({
        where: { id: 1 },
        data: { name: 'Updated Name' },
      });
      expect(result).toEqual(mockTournament);
    });
  });

  describe('updateStatus', () => {
    it('should update status to IN_PROGRESS', async () => {
      const mockTournament = { id: 1, status: 'IN_PROGRESS' };
      mockPrismaClient.tournament.update.mockResolvedValueOnce(mockTournament);

      const result = await dao.updateStatus(1, 'IN_PROGRESS');

      expect(mockPrismaClient.tournament.update).toBeCalledWith({
        where: { id: 1 },
        data: { status: 'IN_PROGRESS' },
      });
      expect(result).toEqual(mockTournament);
    });

    it('should set endTime when status is COMPLETED', async () => {
      const mockTournament = { id: 1, status: 'COMPLETED', endTime: new Date() };
      mockPrismaClient.tournament.update.mockResolvedValueOnce(mockTournament);

      await dao.updateStatus(1, 'COMPLETED');

      expect(mockPrismaClient.tournament.update).toBeCalledWith({
        where: { id: 1 },
        data: {
          status: 'COMPLETED',
          endTime: expect.any(Date),
        },
      });
    });

    it('should set endTime when status is CANCELLED', async () => {
      const mockTournament = { id: 1, status: 'CANCELLED', endTime: new Date() };
      mockPrismaClient.tournament.update.mockResolvedValueOnce(mockTournament);

      await dao.updateStatus(1, 'CANCELLED');

      expect(mockPrismaClient.tournament.update).toBeCalledWith({
        where: { id: 1 },
        data: {
          status: 'CANCELLED',
          endTime: expect.any(Date),
        },
      });
    });
  });

  describe('delete', () => {
    it('should delete a tournament', async () => {
      await dao.delete(1);

      expect(mockPrismaClient.tournament.delete).toBeCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('countByStatus', () => {
    it('should count tournaments by status', async () => {
      mockPrismaClient.tournament.count.mockResolvedValueOnce(3);

      const result = await dao.countByStatus('REGISTRATION');

      expect(mockPrismaClient.tournament.count).toBeCalledWith({
        where: { status: 'REGISTRATION' },
      });
      expect(result).toBe(3);
    });
  });

  describe('getParticipantCount', () => {
    it('should get participant count for a tournament', async () => {
      mockPrismaClient.tournamentParticipant.count.mockResolvedValueOnce(5);

      const result = await dao.getParticipantCount(1);

      expect(mockPrismaClient.tournamentParticipant.count).toBeCalledWith({
        where: { tournamentId: 1 },
      });
      expect(result).toBe(5);
    });
  });

  describe('hasCapacity', () => {
    it('should return true when tournament has room', async () => {
      mockPrismaClient.tournament.findUnique.mockResolvedValueOnce({
        id: 1,
        maxPlayers: 8,
      });
      mockPrismaClient.tournamentParticipant.count.mockResolvedValueOnce(5);

      const result = await dao.hasCapacity(1);

      expect(result).toBe(true);
    });

    it('should return false when tournament is full', async () => {
      mockPrismaClient.tournament.findUnique.mockResolvedValueOnce({
        id: 1,
        maxPlayers: 8,
      });
      mockPrismaClient.tournamentParticipant.count.mockResolvedValueOnce(8);

      const result = await dao.hasCapacity(1);

      expect(result).toBe(false);
    });

    it('should return false when tournament not found', async () => {
      mockPrismaClient.tournament.findUnique.mockResolvedValueOnce(null);

      const result = await dao.hasCapacity(999);

      expect(result).toBe(false);
    });
  });

  describe('hasMinimumPlayers', () => {
    it('should return true when minimum players met', async () => {
      mockPrismaClient.tournament.findUnique.mockResolvedValueOnce({
        id: 1,
        minPlayers: 4,
      });
      mockPrismaClient.tournamentParticipant.count.mockResolvedValueOnce(5);

      const result = await dao.hasMinimumPlayers(1);

      expect(result).toBe(true);
    });

    it('should return false when below minimum', async () => {
      mockPrismaClient.tournament.findUnique.mockResolvedValueOnce({
        id: 1,
        minPlayers: 4,
      });
      mockPrismaClient.tournamentParticipant.count.mockResolvedValueOnce(2);

      const result = await dao.hasMinimumPlayers(1);

      expect(result).toBe(false);
    });

    it('should return false when tournament not found', async () => {
      mockPrismaClient.tournament.findUnique.mockResolvedValueOnce(null);

      const result = await dao.hasMinimumPlayers(999);

      expect(result).toBe(false);
    });
  });
});
