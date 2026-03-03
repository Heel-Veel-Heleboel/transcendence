import { ChatService, ChatError } from '../../src/services/chat.js';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockChannelDao = {
  create: vi.fn(),
  findById: vi.fn(),
  findFirst: vi.fn(),
  findDMBetweenUsers: vi.fn(),
  findByUserId: vi.fn(),
  addMember: vi.fn(),
  removeMember: vi.fn(),
  isMember: vi.fn(),
  getMemberIds: vi.fn(),
  delete: vi.fn(),
};

const mockMessageDao = {
  create: vi.fn(),
  findById: vi.fn(),
  findByChannel: vi.fn(),
  updateMetadata: vi.fn(),
};

const mockNotificationService = {
  notifyUsers: vi.fn(),
  notifyChannelMembers: vi.fn(),
};

const mockBlockService = {
  isBlocked: vi.fn(),
  getBlockedUserIds: vi.fn(),
};

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockBlockService.isBlocked.mockResolvedValue(false);
    mockBlockService.getBlockedUserIds.mockResolvedValue([]);
    mockNotificationService.notifyUsers.mockResolvedValue(undefined);
    mockNotificationService.notifyChannelMembers.mockResolvedValue(undefined);

    service = new ChatService(
      mockChannelDao as any,
      mockMessageDao as any,
      mockNotificationService as any,
      mockBlockService as any,
    );
  });

  // ── createDMChannel ─────────────────────────────────────

  describe('createDMChannel', () => {
    it('should create a new DM channel and notify target user', async () => {
      mockChannelDao.findDMBetweenUsers.mockResolvedValueOnce(null);
      const mockChannel = {
        id: 'dm-1',
        type: 'DM',
        name: null,
        members: [{ userId: 1 }, { userId: 2 }],
      };
      mockChannelDao.create.mockResolvedValueOnce(mockChannel);

      const result = await service.createDMChannel(1, 2);

      expect(mockBlockService.isBlocked).toBeCalledWith(1, 2);
      expect(mockChannelDao.findDMBetweenUsers).toBeCalledWith(1, 2);
      expect(mockChannelDao.create).toBeCalledWith({
        type: 'DM',
        createdBy: 1,
        memberIds: [1, 2],
      });
      expect(mockNotificationService.notifyUsers).toBeCalledWith([2], expect.objectContaining({
        type: 'chat:channel_created',
      }));
      expect(result).toEqual(mockChannel);
    });

    it('should return existing DM channel without creating new one', async () => {
      const existingChannel = { id: 'dm-existing', type: 'DM', members: [{ userId: 1 }, { userId: 2 }] };
      mockChannelDao.findDMBetweenUsers.mockResolvedValueOnce(existingChannel);

      const result = await service.createDMChannel(1, 2);

      expect(mockChannelDao.create).not.toBeCalled();
      expect(mockNotificationService.notifyUsers).not.toBeCalled();
      expect(result).toEqual(existingChannel);
    });

    it('should throw 400 when creating DM with yourself', async () => {
      await expect(service.createDMChannel(1, 1)).rejects.toThrow(
        new ChatError(400, 'Cannot create DM with yourself')
      );
    });

    it('should throw 403 when target user is blocked', async () => {
      mockBlockService.isBlocked.mockResolvedValueOnce(true);

      await expect(service.createDMChannel(1, 2)).rejects.toThrow(
        new ChatError(403, 'Cannot create DM with this user')
      );
      expect(mockChannelDao.create).not.toBeCalled();
    });
  });

  // ── createGroupChannel ──────────────────────────────────

  describe('createGroupChannel', () => {
    it('should create a group channel and notify other members', async () => {
      const mockChannel = {
        id: 'grp-1',
        type: 'GROUP',
        name: 'Test Group',
        members: [{ userId: 1 }, { userId: 2 }, { userId: 3 }],
      };
      mockChannelDao.create.mockResolvedValueOnce(mockChannel);

      const result = await service.createGroupChannel(1, 'Test Group', [2, 3]);

      expect(mockChannelDao.create).toBeCalledWith({
        type: 'GROUP',
        name: 'Test Group',
        createdBy: 1,
        memberIds: [1, 2, 3],
      });
      expect(mockNotificationService.notifyUsers).toBeCalledWith([2, 3], expect.objectContaining({
        type: 'chat:channel_created',
      }));
      expect(result).toEqual(mockChannel);
    });

    it('should deduplicate member IDs including creator', async () => {
      const mockChannel = {
        id: 'grp-1',
        type: 'GROUP',
        name: 'Test',
        members: [{ userId: 1 }, { userId: 2 }],
      };
      mockChannelDao.create.mockResolvedValueOnce(mockChannel);

      await service.createGroupChannel(1, 'Test', [1, 2, 2]);

      expect(mockChannelDao.create).toBeCalledWith(
        expect.objectContaining({ memberIds: [1, 2] })
      );
    });

    it('should not notify if creator is the only member', async () => {
      const mockChannel = {
        id: 'grp-1',
        type: 'GROUP',
        name: 'Solo',
        members: [{ userId: 1 }],
      };
      mockChannelDao.create.mockResolvedValueOnce(mockChannel);

      await service.createGroupChannel(1, 'Solo', []);

      expect(mockNotificationService.notifyUsers).not.toBeCalled();
    });
  });

  // ── getChannel ──────────────────────────────────────────

  describe('getChannel', () => {
    it('should return channel if user is a member', async () => {
      const mockChannel = {
        id: 'ch-1',
        members: [{ userId: 1 }, { userId: 2 }],
      };
      mockChannelDao.findById.mockResolvedValueOnce(mockChannel);

      const result = await service.getChannel('ch-1', 1);

      expect(result).toEqual(mockChannel);
    });

    it('should throw 404 if channel not found', async () => {
      mockChannelDao.findById.mockResolvedValueOnce(null);

      await expect(service.getChannel('bad-id', 1)).rejects.toThrow(
        new ChatError(404, 'Channel not found')
      );
    });

    it('should throw 403 if user is not a member', async () => {
      mockChannelDao.findById.mockResolvedValueOnce({
        id: 'ch-1',
        members: [{ userId: 2 }, { userId: 3 }],
      });

      await expect(service.getChannel('ch-1', 99)).rejects.toThrow(
        new ChatError(403, 'Not a member of this channel')
      );
    });
  });

  // ── addMember ───────────────────────────────────────────

  describe('addMember', () => {
    it('should add member to group channel', async () => {
      mockChannelDao.findById.mockResolvedValueOnce({
        id: 'ch-1',
        type: 'GROUP',
        name: 'Group',
        members: [{ userId: 1 }],
      });
      // sendSystemMessage internals
      mockMessageDao.create.mockResolvedValueOnce({
        id: 'msg-sys', senderId: 0, content: 'User 5 joined the channel',
        type: 'SYSTEM', createdAt: new Date('2026-01-01'),
      });

      await service.addMember('ch-1', 1, 5);

      expect(mockChannelDao.addMember).toBeCalledWith('ch-1', 5);
      expect(mockNotificationService.notifyUsers).toBeCalledWith([5], expect.objectContaining({
        type: 'chat:channel_created',
      }));
    });

    it('should throw 400 when adding member to DM', async () => {
      mockChannelDao.findById.mockResolvedValueOnce({
        id: 'ch-1',
        type: 'DM',
        members: [{ userId: 1 }, { userId: 2 }],
      });

      await expect(service.addMember('ch-1', 1, 3)).rejects.toThrow(
        new ChatError(400, 'Cannot add members to a DM')
      );
    });

    it('should throw 403 when requester is not a member', async () => {
      mockChannelDao.findById.mockResolvedValueOnce({
        id: 'ch-1',
        type: 'GROUP',
        members: [{ userId: 2 }],
      });

      await expect(service.addMember('ch-1', 99, 5)).rejects.toThrow(
        new ChatError(403, 'Not a member of this channel')
      );
    });

    it('should throw 409 when user is already a member', async () => {
      mockChannelDao.findById.mockResolvedValueOnce({
        id: 'ch-1',
        type: 'GROUP',
        members: [{ userId: 1 }, { userId: 5 }],
      });

      await expect(service.addMember('ch-1', 1, 5)).rejects.toThrow(
        new ChatError(409, 'User is already a member')
      );
    });
  });

  // ── removeMember ────────────────────────────────────────

  describe('removeMember', () => {
    it('should allow user to remove themselves', async () => {
      mockChannelDao.findById.mockResolvedValueOnce({
        id: 'ch-1',
        type: 'GROUP',
        createdBy: 1,
        members: [{ userId: 1 }, { userId: 5 }],
      });
      mockMessageDao.create.mockResolvedValueOnce({
        id: 'msg-sys', senderId: 0, content: 'User 5 left the channel',
        type: 'SYSTEM', createdAt: new Date('2026-01-01'),
      });

      await service.removeMember('ch-1', 5, 5);

      expect(mockChannelDao.removeMember).toBeCalledWith('ch-1', 5);
    });

    it('should allow channel creator to remove others', async () => {
      mockChannelDao.findById.mockResolvedValueOnce({
        id: 'ch-1',
        type: 'GROUP',
        createdBy: 1,
        members: [{ userId: 1 }, { userId: 5 }],
      });
      mockMessageDao.create.mockResolvedValueOnce({
        id: 'msg-sys', senderId: 0, content: 'User 5 left the channel',
        type: 'SYSTEM', createdAt: new Date('2026-01-01'),
      });

      await service.removeMember('ch-1', 1, 5);

      expect(mockChannelDao.removeMember).toBeCalledWith('ch-1', 5);
    });

    it('should throw 403 when non-creator tries to remove another user', async () => {
      mockChannelDao.findById.mockResolvedValueOnce({
        id: 'ch-1',
        type: 'GROUP',
        createdBy: 1,
        members: [{ userId: 1 }, { userId: 2 }, { userId: 3 }],
      });

      await expect(service.removeMember('ch-1', 2, 3)).rejects.toThrow(
        new ChatError(403, 'Only the channel creator can remove members')
      );
    });

    it('should throw 400 when trying to leave a DM', async () => {
      mockChannelDao.findById.mockResolvedValueOnce({
        id: 'ch-1',
        type: 'DM',
        members: [{ userId: 1 }, { userId: 2 }],
      });

      await expect(service.removeMember('ch-1', 1, 1)).rejects.toThrow(
        new ChatError(400, 'Cannot leave a DM')
      );
    });
  });

  // ── sendMessage ─────────────────────────────────────────

  describe('sendMessage', () => {
    it('should create message and notify channel members', async () => {
      mockChannelDao.isMember.mockResolvedValueOnce(true);
      const mockMessage = {
        id: 'msg-1',
        channelId: 'ch-1',
        senderId: 1,
        content: 'Hello!',
        type: 'TEXT',
        createdAt: new Date('2026-01-01'),
      };
      mockMessageDao.create.mockResolvedValueOnce(mockMessage);

      const result = await service.sendMessage('ch-1', 1, 'Hello!');

      expect(mockMessageDao.create).toBeCalledWith({
        channelId: 'ch-1',
        senderId: 1,
        content: 'Hello!',
      });
      expect(mockNotificationService.notifyChannelMembers).toBeCalledWith(
        'ch-1',
        expect.objectContaining({ type: 'chat:message', channelId: 'ch-1' }),
        1
      );
      expect(result).toEqual(mockMessage);
    });

    it('should throw 403 if sender is not a member', async () => {
      mockChannelDao.isMember.mockResolvedValueOnce(false);

      await expect(service.sendMessage('ch-1', 99, 'Hello!')).rejects.toThrow(
        new ChatError(403, 'Not a member of this channel')
      );
      expect(mockMessageDao.create).not.toBeCalled();
    });
  });

  // ── getMessages ─────────────────────────────────────────

  describe('getMessages', () => {
    it('should return messages for channel member', async () => {
      mockChannelDao.isMember.mockResolvedValueOnce(true);
      const mockMessages = [
        { id: 'msg-2', senderId: 2, content: 'Hi', type: 'TEXT' },
        { id: 'msg-1', senderId: 1, content: 'Hello', type: 'TEXT' },
      ];
      mockMessageDao.findByChannel.mockResolvedValueOnce(mockMessages);

      const result = await service.getMessages('ch-1', 1);

      expect(mockMessageDao.findByChannel).toBeCalledWith('ch-1', { cursor: undefined, limit: undefined });
      expect(result).toEqual(mockMessages);
    });

    it('should filter out messages from blocked users', async () => {
      mockChannelDao.isMember.mockResolvedValueOnce(true);
      mockBlockService.getBlockedUserIds.mockResolvedValueOnce([3]);
      const mockMessages = [
        { id: 'msg-1', senderId: 1, content: 'Hello', type: 'TEXT' },
        { id: 'msg-2', senderId: 3, content: 'Blocked msg', type: 'TEXT' },
        { id: 'msg-3', senderId: 0, content: 'System msg', type: 'SYSTEM' },
      ];
      mockMessageDao.findByChannel.mockResolvedValueOnce(mockMessages);

      const result = await service.getMessages('ch-1', 1);

      expect(result).toHaveLength(2);
      expect(result.map((m: any) => m.id)).toEqual(['msg-1', 'msg-3']);
    });

    it('should keep SYSTEM messages even if senderId is in blocked list', async () => {
      mockChannelDao.isMember.mockResolvedValueOnce(true);
      mockBlockService.getBlockedUserIds.mockResolvedValueOnce([0]);
      const mockMessages = [
        { id: 'msg-1', senderId: 0, content: 'System', type: 'SYSTEM' },
      ];
      mockMessageDao.findByChannel.mockResolvedValueOnce(mockMessages);

      const result = await service.getMessages('ch-1', 1);

      expect(result).toHaveLength(1);
    });

    it('should throw 403 if user is not a member', async () => {
      mockChannelDao.isMember.mockResolvedValueOnce(false);

      await expect(service.getMessages('ch-1', 99)).rejects.toThrow(
        new ChatError(403, 'Not a member of this channel')
      );
    });

    it('should pass cursor and limit to DAO', async () => {
      mockChannelDao.isMember.mockResolvedValueOnce(true);
      mockMessageDao.findByChannel.mockResolvedValueOnce([]);

      await service.getMessages('ch-1', 1, 'msg-5', 20);

      expect(mockMessageDao.findByChannel).toBeCalledWith('ch-1', { cursor: 'msg-5', limit: 20 });
    });
  });

  // ── sendMatchAck ────────────────────────────────────────

  describe('sendMatchAck', () => {
    it('should create a DM and post one shared ack message when no DM exists', async () => {
      mockChannelDao.findDMBetweenUsers.mockResolvedValueOnce(null);
      const mockChannel = { id: 'dm-1', type: 'DM', name: null, members: [{ userId: 1 }, { userId: 2 }] };
      mockChannelDao.create.mockResolvedValueOnce(mockChannel);
      const mockMessage = { id: 'ack-1', senderId: 0, type: 'SYSTEM', createdAt: new Date('2026-01-01') };
      mockMessageDao.create.mockResolvedValueOnce(mockMessage);

      const result = await service.sendMatchAck('match-123', [1, 2], 'classic', '2026-01-01T12:05:00Z');

      expect(mockChannelDao.findDMBetweenUsers).toBeCalledWith(1, 2);
      expect(mockChannelDao.create).toBeCalledWith({ type: 'DM', memberIds: [1, 2] });
      expect(mockMessageDao.create).toBeCalledTimes(1);
      expect(mockNotificationService.notifyUsers).toBeCalledWith([1, 2], expect.objectContaining({
        type: 'chat:match_ack_required',
        matchId: 'match-123',
        gameMode: 'classic',
      }));
      expect(result.channel).toEqual(mockChannel);
      expect(result.message).toEqual(mockMessage);
    });

    it('should reuse existing DM without creating a new channel', async () => {
      const existingDM = { id: 'dm-existing', type: 'DM', members: [{ userId: 1 }, { userId: 2 }] };
      mockChannelDao.findDMBetweenUsers.mockResolvedValueOnce(existingDM);
      mockMessageDao.create.mockResolvedValueOnce({ id: 'ack-1', createdAt: new Date() });

      const result = await service.sendMatchAck('match-456', [1, 2], 'powerup', '2026-01-01T12:05:00Z');

      expect(mockChannelDao.create).not.toBeCalled();
      expect(result.channel).toEqual(existingDM);
    });

    it('should store playerIds, acknowledgedBy: [], and status: pending in shared message metadata', async () => {
      mockChannelDao.findDMBetweenUsers.mockResolvedValueOnce(null);
      mockChannelDao.create.mockResolvedValueOnce({ id: 'dm-1', type: 'DM', members: [] });
      mockMessageDao.create.mockResolvedValueOnce({ id: 'ack-1', createdAt: new Date() });

      await service.sendMatchAck('match-1', [10, 20], 'powerup', '2026-01-01T12:05:00Z');

      const meta = JSON.parse(mockMessageDao.create.mock.calls[0][0].metadata);
      expect(meta.playerIds).toEqual([10, 20]);
      expect(meta.acknowledgedBy).toEqual([]);
      expect(meta.status).toBe('pending');
      expect(meta.matchId).toBe('match-1');
    });

    it('should throw 400 for duplicate or fewer than 2 unique player IDs', async () => {
      await expect(service.sendMatchAck('match-1', [1, 1], 'classic', '2026-01-01T12:05:00Z'))
        .rejects.toThrow(new ChatError(400, 'sendMatchAck requires exactly 2 unique player IDs'));
    });
  });

  // ── respondToMatchAck ───────────────────────────────────

  describe('respondToMatchAck', () => {
    const futureDate = new Date(Date.now() + 300_000).toISOString();

    const pendingMeta = (overrides: object = {}) => JSON.stringify({
      matchId: 'match-1',
      gameMode: 'classic',
      playerIds: [1, 2],
      acknowledgedBy: [],
      expiresAt: futureDate,
      status: 'pending',
      ...overrides,
    });

    it('should add player to acknowledgedBy and emit bothAcked: false when first player acks', async () => {
      mockMessageDao.findById.mockResolvedValueOnce({
        id: 'ack-1', channelId: 'dm-1', metadata: pendingMeta(),
      });

      const result = await service.respondToMatchAck('ack-1', 1, true);

      const saved = JSON.parse(mockMessageDao.updateMetadata.mock.calls[0][1]);
      expect(saved.acknowledgedBy).toEqual([1]);
      expect(saved.status).toBe('pending');
      expect(mockNotificationService.notifyUsers).toBeCalledWith([1, 2], expect.objectContaining({
        type: 'chat:match_ack_response',
        acknowledged: true,
        bothAcked: false,
      }));
      expect(result).toEqual({ acknowledged: true, matchId: 'match-1', gameMode: 'classic', bothAcked: false });
    });

    it('should set status to acknowledged and bothAcked: true when second player acks', async () => {
      mockMessageDao.findById.mockResolvedValueOnce({
        id: 'ack-1', channelId: 'dm-1', metadata: pendingMeta({ acknowledgedBy: [1] }),
      });

      const result = await service.respondToMatchAck('ack-1', 2, true);

      const saved = JSON.parse(mockMessageDao.updateMetadata.mock.calls[0][1]);
      expect(saved.acknowledgedBy).toEqual([1, 2]);
      expect(saved.status).toBe('acknowledged');
      expect(result.bothAcked).toBe(true);
    });

    it('should set status to declined and notify both players when a player cancels', async () => {
      mockMessageDao.findById.mockResolvedValueOnce({
        id: 'ack-1', channelId: 'dm-1', metadata: pendingMeta(),
      });

      const result = await service.respondToMatchAck('ack-1', 1, false);

      expect(mockMessageDao.updateMetadata).toBeCalledWith(
        'ack-1',
        expect.stringContaining('"status":"declined"')
      );
      expect(mockNotificationService.notifyUsers).toBeCalledWith([1, 2], expect.objectContaining({
        acknowledged: false,
      }));
      expect(result).toEqual({ acknowledged: false, matchId: 'match-1', gameMode: 'classic' });
    });

    it('should throw 403 if caller is not one of the matched players', async () => {
      mockMessageDao.findById.mockResolvedValueOnce({
        id: 'ack-1', channelId: 'dm-1', metadata: pendingMeta(),
      });

      await expect(service.respondToMatchAck('ack-1', 99, true)).rejects.toThrow(
        new ChatError(403, 'You are not part of this match')
      );
    });

    it('should throw 409 if player has already responded', async () => {
      mockMessageDao.findById.mockResolvedValueOnce({
        id: 'ack-1', channelId: 'dm-1', metadata: pendingMeta({ acknowledgedBy: [1] }),
      });

      await expect(service.respondToMatchAck('ack-1', 1, true)).rejects.toThrow(
        new ChatError(409, 'You have already responded to this match')
      );
    });

    it('should throw 400 if match is already in a terminal state', async () => {
      mockMessageDao.findById.mockResolvedValueOnce({
        id: 'ack-1', channelId: 'dm-1', metadata: pendingMeta({ status: 'acknowledged' }),
      });

      await expect(service.respondToMatchAck('ack-1', 1, true)).rejects.toThrow(
        new ChatError(400, 'Match already acknowledged')
      );
    });

    it('should throw 410 and mark as expired if past deadline', async () => {
      const pastDate = new Date(Date.now() - 60_000).toISOString();
      mockMessageDao.findById.mockResolvedValueOnce({
        id: 'ack-1', channelId: 'dm-1', metadata: pendingMeta({ expiresAt: pastDate }),
      });

      await expect(service.respondToMatchAck('ack-1', 1, true)).rejects.toThrow(
        new ChatError(410, 'Match acknowledgement has expired')
      );
      expect(mockMessageDao.updateMetadata).toBeCalledWith(
        'ack-1',
        expect.stringContaining('"status":"expired"')
      );
    });

    it('should throw 404 if message not found', async () => {
      mockMessageDao.findById.mockResolvedValueOnce(null);

      await expect(service.respondToMatchAck('bad-id', 1, true)).rejects.toThrow(
        new ChatError(404, 'Match acknowledgement not found')
      );
    });

    it('should throw 400 if message has no metadata', async () => {
      mockMessageDao.findById.mockResolvedValueOnce({ id: 'msg-1', channelId: 'dm-1', metadata: null });

      await expect(service.respondToMatchAck('msg-1', 1, true)).rejects.toThrow(
        new ChatError(400, 'Not a match acknowledgement message')
      );
    });
  });

  // ── createTournamentChannel ─────────────────────────────

  describe('createTournamentChannel', () => {
    it('should create tournament channel with system message', async () => {
      mockChannelDao.findByUserId.mockResolvedValueOnce([]);
      const mockChannel = {
        id: 'tourn-1',
        type: 'TOURNAMENT',
        name: 'Tournament #10: Spring Cup',
        members: [{ userId: 1 }],
      };
      mockChannelDao.create.mockResolvedValueOnce(mockChannel);
      mockMessageDao.create.mockResolvedValueOnce({
        id: 'sys-msg', senderId: 0, content: 'subscribed', type: 'SYSTEM', createdAt: new Date('2026-01-01'),
      });

      const result = await service.createTournamentChannel(1, 10, 'Spring Cup');

      expect(mockChannelDao.create).toBeCalledWith({
        type: 'TOURNAMENT',
        name: 'Tournament #10: Spring Cup',
        memberIds: [1],
      });
      expect(result).toEqual(mockChannel);
    });

    it('should return existing tournament channel if found', async () => {
      const existing = {
        id: 'tourn-existing',
        type: 'TOURNAMENT',
        name: 'Tournament #10: Spring Cup',
        members: [{ userId: 1 }],
      };
      mockChannelDao.findByUserId.mockResolvedValueOnce([existing]);

      const result = await service.createTournamentChannel(1, 10, 'Spring Cup');

      expect(mockChannelDao.create).not.toBeCalled();
      expect(result).toEqual(existing);
    });
  });

  // ── sendSystemMessage ───────────────────────────────────

  describe('sendSystemMessage', () => {
    it('should create system message and notify channel members', async () => {
      const mockMessage = {
        id: 'sys-1',
        senderId: 0,
        content: 'Welcome!',
        type: 'SYSTEM',
        createdAt: new Date('2026-01-01'),
      };
      mockMessageDao.create.mockResolvedValueOnce(mockMessage);

      await service.sendSystemMessage('ch-1', 'Welcome!');

      expect(mockMessageDao.create).toBeCalledWith({
        channelId: 'ch-1',
        senderId: 0,
        content: 'Welcome!',
        type: 'SYSTEM',
      });
      expect(mockNotificationService.notifyChannelMembers).toBeCalledWith(
        'ch-1',
        expect.objectContaining({ type: 'chat:message' }),
      );
    });
  });
});
