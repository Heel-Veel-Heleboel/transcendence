import { MessageDao } from '../../src/dao/message.dao.js';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockPrismaClient = {
  message: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  channel: {
    update: vi.fn(),
  },
};

describe('MessageDao', () => {
  let dao: MessageDao;

  beforeEach(() => {
    vi.clearAllMocks();
    dao = new MessageDao(mockPrismaClient as any);
  });

  describe('create', () => {
    it('should create a text message and touch channel updatedAt', async () => {
      const mockMessage = {
        id: 'msg-uuid',
        channelId: 'ch-1',
        senderId: 1,
        content: 'Hello!',
        type: 'TEXT',
        metadata: null,
        createdAt: new Date(),
      };
      mockPrismaClient.message.create.mockResolvedValueOnce(mockMessage);
      mockPrismaClient.channel.update.mockResolvedValueOnce({});

      const result = await dao.create({
        channelId: 'ch-1',
        senderId: 1,
        content: 'Hello!',
      });

      expect(mockPrismaClient.message.create).toBeCalledWith({
        data: {
          channelId: 'ch-1',
          senderId: 1,
          content: 'Hello!',
          type: 'TEXT',
          metadata: undefined,
        },
      });
      expect(mockPrismaClient.channel.update).toBeCalledWith({
        where: { id: 'ch-1' },
        data: { updatedAt: expect.any(Date) },
      });
      expect(result).toEqual(mockMessage);
    });

    it('should create a GAME_INVITE message with metadata', async () => {
      const metadata = JSON.stringify({
        gameMode: 'classic',
        targetUserId: 2,
        expiresAt: '2026-01-01T12:05:00Z',
        status: 'pending',
      });
      const mockMessage = {
        id: 'msg-uuid',
        channelId: 'ch-1',
        senderId: 1,
        content: 'Game invite: classic',
        type: 'GAME_INVITE',
        metadata,
        createdAt: new Date(),
      };
      mockPrismaClient.message.create.mockResolvedValueOnce(mockMessage);
      mockPrismaClient.channel.update.mockResolvedValueOnce({});

      const result = await dao.create({
        channelId: 'ch-1',
        senderId: 1,
        content: 'Game invite: classic',
        type: 'GAME_INVITE',
        metadata,
      });

      expect(mockPrismaClient.message.create).toBeCalledWith({
        data: {
          channelId: 'ch-1',
          senderId: 1,
          content: 'Game invite: classic',
          type: 'GAME_INVITE',
          metadata,
        },
      });
      expect(result).toEqual(mockMessage);
    });

    it('should create a SYSTEM message', async () => {
      const mockMessage = {
        id: 'msg-uuid',
        channelId: 'ch-1',
        senderId: 0,
        content: 'User 3 joined the channel',
        type: 'SYSTEM',
        metadata: null,
        createdAt: new Date(),
      };
      mockPrismaClient.message.create.mockResolvedValueOnce(mockMessage);
      mockPrismaClient.channel.update.mockResolvedValueOnce({});

      const result = await dao.create({
        channelId: 'ch-1',
        senderId: 0,
        content: 'User 3 joined the channel',
        type: 'SYSTEM',
      });

      expect(mockPrismaClient.message.create).toBeCalledWith({
        data: {
          channelId: 'ch-1',
          senderId: 0,
          content: 'User 3 joined the channel',
          type: 'SYSTEM',
          metadata: undefined,
        },
      });
      expect(result).toEqual(mockMessage);
    });
  });

  describe('findById', () => {
    it('should find a message by ID', async () => {
      const mockMessage = {
        id: 'msg-uuid',
        channelId: 'ch-1',
        senderId: 1,
        content: 'Hello!',
      };
      mockPrismaClient.message.findUnique.mockResolvedValueOnce(mockMessage);

      const result = await dao.findById('msg-uuid');

      expect(mockPrismaClient.message.findUnique).toBeCalledWith({
        where: { id: 'msg-uuid' },
      });
      expect(result).toEqual(mockMessage);
    });

    it('should return null if message not found', async () => {
      mockPrismaClient.message.findUnique.mockResolvedValueOnce(null);

      const result = await dao.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByChannel', () => {
    it('should fetch messages with default limit', async () => {
      const mockMessages = [
        { id: 'msg-2', content: 'Second', createdAt: new Date('2026-01-02') },
        { id: 'msg-1', content: 'First', createdAt: new Date('2026-01-01') },
      ];
      mockPrismaClient.message.findMany.mockResolvedValueOnce(mockMessages);

      const result = await dao.findByChannel('ch-1');

      expect(mockPrismaClient.message.findMany).toBeCalledWith({
        where: { channelId: 'ch-1' },
        take: 50,
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockMessages);
    });

    it('should fetch messages with custom limit', async () => {
      mockPrismaClient.message.findMany.mockResolvedValueOnce([]);

      await dao.findByChannel('ch-1', { limit: 10 });

      expect(mockPrismaClient.message.findMany).toBeCalledWith({
        where: { channelId: 'ch-1' },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should fetch messages with cursor-based pagination', async () => {
      mockPrismaClient.message.findMany.mockResolvedValueOnce([]);

      await dao.findByChannel('ch-1', { cursor: 'msg-5', limit: 20 });

      expect(mockPrismaClient.message.findMany).toBeCalledWith({
        where: { channelId: 'ch-1' },
        take: 20,
        skip: 1,
        cursor: { id: 'msg-5' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('updateMetadata', () => {
    it('should update message metadata', async () => {
      const newMetadata = JSON.stringify({
        gameMode: 'classic',
        targetUserId: 2,
        expiresAt: '2026-01-01T12:05:00Z',
        status: 'accepted',
      });
      const mockMessage = { id: 'msg-uuid', metadata: newMetadata };
      mockPrismaClient.message.update.mockResolvedValueOnce(mockMessage);

      const result = await dao.updateMetadata('msg-uuid', newMetadata);

      expect(mockPrismaClient.message.update).toBeCalledWith({
        where: { id: 'msg-uuid' },
        data: { metadata: newMetadata },
      });
      expect(result).toEqual(mockMessage);
    });
  });
});
