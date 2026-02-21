import { ChannelDao } from '../../src/dao/channel.dao.js';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockPrismaClient = {
  channel: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  },
  channelMember: {
    create: vi.fn(),
    deleteMany: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
};

describe('ChannelDao', () => {
  let dao: ChannelDao;

  beforeEach(() => {
    vi.clearAllMocks();
    dao = new ChannelDao(mockPrismaClient as any);
  });

  describe('create', () => {
    it('should create a DM channel with two members', async () => {
      const mockChannel = {
        id: 'channel-uuid',
        type: 'DM',
        name: null,
        createdBy: 1,
        members: [
          { id: 'm1', channelId: 'channel-uuid', userId: 1 },
          { id: 'm2', channelId: 'channel-uuid', userId: 2 },
        ],
      };
      mockPrismaClient.channel.create.mockResolvedValueOnce(mockChannel);

      const result = await dao.create({
        type: 'DM',
        createdBy: 1,
        memberIds: [1, 2],
      });

      expect(mockPrismaClient.channel.create).toBeCalledWith({
        data: {
          type: 'DM',
          name: undefined,
          createdBy: 1,
          members: {
            create: [{ userId: 1 }, { userId: 2 }],
          },
        },
        include: { members: true },
      });
      expect(result).toEqual(mockChannel);
    });

    it('should create a GROUP channel with name', async () => {
      const mockChannel = {
        id: 'channel-uuid',
        type: 'GROUP',
        name: 'Test Group',
        createdBy: 1,
        members: [
          { id: 'm1', channelId: 'channel-uuid', userId: 1 },
          { id: 'm2', channelId: 'channel-uuid', userId: 2 },
          { id: 'm3', channelId: 'channel-uuid', userId: 3 },
        ],
      };
      mockPrismaClient.channel.create.mockResolvedValueOnce(mockChannel);

      const result = await dao.create({
        type: 'GROUP',
        name: 'Test Group',
        createdBy: 1,
        memberIds: [1, 2, 3],
      });

      expect(mockPrismaClient.channel.create).toBeCalledWith({
        data: {
          type: 'GROUP',
          name: 'Test Group',
          createdBy: 1,
          members: {
            create: [{ userId: 1 }, { userId: 2 }, { userId: 3 }],
          },
        },
        include: { members: true },
      });
      expect(result).toEqual(mockChannel);
    });
  });

  describe('findById', () => {
    it('should find a channel by ID', async () => {
      const mockChannel = {
        id: 'channel-uuid',
        type: 'DM',
        members: [{ userId: 1 }, { userId: 2 }],
      };
      mockPrismaClient.channel.findUnique.mockResolvedValueOnce(mockChannel);

      const result = await dao.findById('channel-uuid');

      expect(mockPrismaClient.channel.findUnique).toBeCalledWith({
        where: { id: 'channel-uuid' },
        include: { members: true },
      });
      expect(result).toEqual(mockChannel);
    });

    it('should return null if channel not found', async () => {
      mockPrismaClient.channel.findUnique.mockResolvedValueOnce(null);

      const result = await dao.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findDMBetweenUsers', () => {
    it('should find existing DM between two users', async () => {
      const mockChannel = {
        id: 'dm-uuid',
        type: 'DM',
        members: [{ userId: 1 }, { userId: 2 }],
      };
      mockPrismaClient.channel.findFirst.mockResolvedValueOnce(mockChannel);

      const result = await dao.findDMBetweenUsers(1, 2);

      expect(mockPrismaClient.channel.findFirst).toBeCalledWith({
        where: {
          type: 'DM',
          AND: [
            { members: { some: { userId: 1 } } },
            { members: { some: { userId: 2 } } },
          ],
        },
        include: { members: true },
      });
      expect(result).toEqual(mockChannel);
    });

    it('should return null if no DM exists', async () => {
      mockPrismaClient.channel.findFirst.mockResolvedValueOnce(null);

      const result = await dao.findDMBetweenUsers(1, 99);

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find all channels a user belongs to', async () => {
      const mockChannels = [
        { id: 'ch-1', type: 'DM', members: [{ userId: 1 }, { userId: 2 }], messages: [] },
        { id: 'ch-2', type: 'GROUP', members: [{ userId: 1 }, { userId: 3 }], messages: [] },
      ];
      mockPrismaClient.channel.findMany.mockResolvedValueOnce(mockChannels);

      const result = await dao.findByUserId(1);

      expect(mockPrismaClient.channel.findMany).toBeCalledWith({
        where: {
          members: { some: { userId: 1 } },
        },
        include: {
          members: true,
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
      expect(result).toEqual(mockChannels);
    });

    it('should return empty array if user has no channels', async () => {
      mockPrismaClient.channel.findMany.mockResolvedValueOnce([]);

      const result = await dao.findByUserId(999);

      expect(result).toEqual([]);
    });
  });

  describe('addMember', () => {
    it('should add a member to a channel', async () => {
      const mockMember = { id: 'member-uuid', channelId: 'ch-1', userId: 5 };
      mockPrismaClient.channelMember.create.mockResolvedValueOnce(mockMember);

      const result = await dao.addMember('ch-1', 5);

      expect(mockPrismaClient.channelMember.create).toBeCalledWith({
        data: { channelId: 'ch-1', userId: 5 },
      });
      expect(result).toEqual(mockMember);
    });
  });

  describe('removeMember', () => {
    it('should remove a member from a channel', async () => {
      mockPrismaClient.channelMember.deleteMany.mockResolvedValueOnce({ count: 1 });

      await dao.removeMember('ch-1', 5);

      expect(mockPrismaClient.channelMember.deleteMany).toBeCalledWith({
        where: { channelId: 'ch-1', userId: 5 },
      });
    });
  });

  describe('isMember', () => {
    it('should return true if user is a member', async () => {
      mockPrismaClient.channelMember.findUnique.mockResolvedValueOnce({
        id: 'member-uuid',
        channelId: 'ch-1',
        userId: 1,
      });

      const result = await dao.isMember('ch-1', 1);

      expect(mockPrismaClient.channelMember.findUnique).toBeCalledWith({
        where: { channelId_userId: { channelId: 'ch-1', userId: 1 } },
      });
      expect(result).toBe(true);
    });

    it('should return false if user is not a member', async () => {
      mockPrismaClient.channelMember.findUnique.mockResolvedValueOnce(null);

      const result = await dao.isMember('ch-1', 99);

      expect(result).toBe(false);
    });
  });

  describe('getMemberIds', () => {
    it('should return all member user IDs for a channel', async () => {
      mockPrismaClient.channelMember.findMany.mockResolvedValueOnce([
        { userId: 1 },
        { userId: 2 },
        { userId: 3 },
      ]);

      const result = await dao.getMemberIds('ch-1');

      expect(mockPrismaClient.channelMember.findMany).toBeCalledWith({
        where: { channelId: 'ch-1' },
        select: { userId: true },
      });
      expect(result).toEqual([1, 2, 3]);
    });

    it('should return empty array for channel with no members', async () => {
      mockPrismaClient.channelMember.findMany.mockResolvedValueOnce([]);

      const result = await dao.getMemberIds('ch-empty');

      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete a channel', async () => {
      mockPrismaClient.channel.delete.mockResolvedValueOnce({ id: 'ch-1' });

      await dao.delete('ch-1');

      expect(mockPrismaClient.channel.delete).toBeCalledWith({
        where: { id: 'ch-1' },
      });
    });
  });
});
