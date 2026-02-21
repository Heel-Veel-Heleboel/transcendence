import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { registerChannelRoutes } from '../../src/routes/channels.js';
import { ChatError } from '../../src/services/chat.js';

describe('Channel Routes', () => {
  let server: FastifyInstance;
  let mockChatService: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    server = Fastify();
    mockChatService = {
      createDMChannel: vi.fn(),
      createGroupChannel: vi.fn(),
      getUserChannels: vi.fn(),
      getChannel: vi.fn(),
      addMember: vi.fn(),
      removeMember: vi.fn(),
    };

    await registerChannelRoutes(server, mockChatService as any);
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  const withAuth = (headers?: Record<string, string>) => ({
    'x-user-id': '1',
    ...headers,
  });

  // ── POST /chat/channels ─────────────────────────────────

  describe('POST /chat/channels', () => {
    it('should create a DM channel', async () => {
      const mockChannel = { id: 'dm-1', type: 'DM', members: [{ userId: 1 }, { userId: 2 }] };
      mockChatService.createDMChannel.mockResolvedValueOnce(mockChannel);

      const response = await server.inject({
        method: 'POST',
        url: '/chat/channels',
        headers: withAuth(),
        payload: { type: 'DM', targetUserId: 2 },
      });

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual(mockChannel);
      expect(mockChatService.createDMChannel).toBeCalledWith(1, 2);
    });

    it('should create a GROUP channel', async () => {
      const mockChannel = { id: 'grp-1', type: 'GROUP', name: 'Test' };
      mockChatService.createGroupChannel.mockResolvedValueOnce(mockChannel);

      const response = await server.inject({
        method: 'POST',
        url: '/chat/channels',
        headers: withAuth(),
        payload: { type: 'GROUP', name: 'Test', memberIds: [2, 3] },
      });

      expect(response.statusCode).toBe(201);
      expect(mockChatService.createGroupChannel).toBeCalledWith(1, 'Test', [2, 3]);
    });

    it('should return 401 without x-user-id', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/chat/channels',
        payload: { type: 'DM', targetUserId: 2 },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 400 for invalid type', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/chat/channels',
        headers: withAuth(),
        payload: { type: 'INVALID' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for DM without targetUserId', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/chat/channels',
        headers: withAuth(),
        payload: { type: 'DM' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for GROUP without name', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/chat/channels',
        headers: withAuth(),
        payload: { type: 'GROUP', memberIds: [2] },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should forward ChatError status code', async () => {
      mockChatService.createDMChannel.mockRejectedValueOnce(new ChatError(403, 'Cannot create DM with this user'));

      const response = await server.inject({
        method: 'POST',
        url: '/chat/channels',
        headers: withAuth(),
        payload: { type: 'DM', targetUserId: 2 },
      });

      expect(response.statusCode).toBe(403);
      expect(JSON.parse(response.body).error).toBe('Cannot create DM with this user');
    });
  });

  // ── GET /chat/channels ──────────────────────────────────

  describe('GET /chat/channels', () => {
    it('should return user channels', async () => {
      const mockChannels = [{ id: 'ch-1' }, { id: 'ch-2' }];
      mockChatService.getUserChannels.mockResolvedValueOnce(mockChannels);

      const response = await server.inject({
        method: 'GET',
        url: '/chat/channels',
        headers: withAuth(),
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual(mockChannels);
      expect(mockChatService.getUserChannels).toBeCalledWith(1);
    });

    it('should return 401 without auth', async () => {
      const response = await server.inject({ method: 'GET', url: '/chat/channels' });
      expect(response.statusCode).toBe(401);
    });
  });

  // ── GET /chat/channels/:channelId ───────────────────────

  describe('GET /chat/channels/:channelId', () => {
    it('should return channel details', async () => {
      const mockChannel = { id: 'ch-1', members: [{ userId: 1 }] };
      mockChatService.getChannel.mockResolvedValueOnce(mockChannel);

      const response = await server.inject({
        method: 'GET',
        url: '/chat/channels/ch-1',
        headers: withAuth(),
      });

      expect(response.statusCode).toBe(200);
      expect(mockChatService.getChannel).toBeCalledWith('ch-1', 1);
    });

    it('should forward 404 from service', async () => {
      mockChatService.getChannel.mockRejectedValueOnce(new ChatError(404, 'Channel not found'));

      const response = await server.inject({
        method: 'GET',
        url: '/chat/channels/bad-id',
        headers: withAuth(),
      });

      expect(response.statusCode).toBe(404);
    });
  });

  // ── POST /chat/channels/:channelId/members ──────────────

  describe('POST /chat/channels/:channelId/members', () => {
    it('should add a member', async () => {
      mockChatService.addMember.mockResolvedValueOnce(undefined);

      const response = await server.inject({
        method: 'POST',
        url: '/chat/channels/ch-1/members',
        headers: withAuth(),
        payload: { userId: 5 },
      });

      expect(response.statusCode).toBe(201);
      expect(mockChatService.addMember).toBeCalledWith('ch-1', 1, 5);
    });

    it('should return 400 without userId', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/chat/channels/ch-1/members',
        headers: withAuth(),
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });
  });

  // ── DELETE /chat/channels/:channelId/members/:userId ────

  describe('DELETE /chat/channels/:channelId/members/:userId', () => {
    it('should remove a member', async () => {
      mockChatService.removeMember.mockResolvedValueOnce(undefined);

      const response = await server.inject({
        method: 'DELETE',
        url: '/chat/channels/ch-1/members/5',
        headers: withAuth(),
      });

      expect(response.statusCode).toBe(200);
      expect(mockChatService.removeMember).toBeCalledWith('ch-1', 1, 5);
    });

    it('should return 400 for non-numeric userId', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/chat/channels/ch-1/members/abc',
        headers: withAuth(),
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
