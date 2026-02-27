import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { registerMessageRoutes } from '../../src/routes/messages.js';
import { ChatError } from '../../src/services/chat.js';

describe('Message Routes', () => {
  let server: FastifyInstance;
  let mockChatService: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    server = Fastify();
    mockChatService = {
      sendMessage: vi.fn(),
      getMessages: vi.fn(),
      respondToMatchAck: vi.fn(),
    };

    await registerMessageRoutes(server, mockChatService as any);
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  const withAuth = (headers?: Record<string, string>) => ({
    'x-user-id': '1',
    ...headers,
  });

  // ── POST /chat/channels/:channelId/messages ─────────────

  describe('POST /chat/channels/:channelId/messages', () => {
    it('should send a message', async () => {
      const mockMessage = { id: 'msg-1', content: 'Hello!', senderId: 1 };
      mockChatService.sendMessage.mockResolvedValueOnce(mockMessage);

      const response = await server.inject({
        method: 'POST',
        url: '/chat/channels/ch-1/messages',
        headers: withAuth(),
        payload: { content: 'Hello!' },
      });

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual(mockMessage);
      expect(mockChatService.sendMessage).toBeCalledWith('ch-1', 1, 'Hello!');
    });

    it('should trim message content', async () => {
      mockChatService.sendMessage.mockResolvedValueOnce({ id: 'msg-1' });

      await server.inject({
        method: 'POST',
        url: '/chat/channels/ch-1/messages',
        headers: withAuth(),
        payload: { content: '  Hello!  ' },
      });

      expect(mockChatService.sendMessage).toBeCalledWith('ch-1', 1, 'Hello!');
    });

    it('should return 400 for empty content', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/chat/channels/ch-1/messages',
        headers: withAuth(),
        payload: { content: '   ' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for missing content', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/chat/channels/ch-1/messages',
        headers: withAuth(),
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 401 without auth', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/chat/channels/ch-1/messages',
        payload: { content: 'Hi' },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should forward 403 from service', async () => {
      mockChatService.sendMessage.mockRejectedValueOnce(
        new ChatError(403, 'Not a member of this channel')
      );

      const response = await server.inject({
        method: 'POST',
        url: '/chat/channels/ch-1/messages',
        headers: withAuth(),
        payload: { content: 'Hello!' },
      });

      expect(response.statusCode).toBe(403);
    });
  });

  // ── GET /chat/channels/:channelId/messages ──────────────

  describe('GET /chat/channels/:channelId/messages', () => {
    it('should return messages', async () => {
      const mockMessages = [{ id: 'msg-1' }, { id: 'msg-2' }];
      mockChatService.getMessages.mockResolvedValueOnce(mockMessages);

      const response = await server.inject({
        method: 'GET',
        url: '/chat/channels/ch-1/messages',
        headers: withAuth(),
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual(mockMessages);
      expect(mockChatService.getMessages).toBeCalledWith('ch-1', 1, undefined, undefined);
    });

    it('should pass cursor and limit query params', async () => {
      mockChatService.getMessages.mockResolvedValueOnce([]);

      await server.inject({
        method: 'GET',
        url: '/chat/channels/ch-1/messages?cursor=msg-5&limit=20',
        headers: withAuth(),
      });

      expect(mockChatService.getMessages).toBeCalledWith('ch-1', 1, 'msg-5', 20);
    });

    it('should return 401 without auth', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/chat/channels/ch-1/messages',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  // ── POST /chat/match-ack/:messageId/respond ─────────────

  describe('POST /chat/match-ack/:messageId/respond', () => {
    it('should acknowledge match', async () => {
      mockChatService.respondToMatchAck.mockResolvedValueOnce({
        acknowledged: true, matchId: 'match-1', gameMode: 'classic',
      });

      const response = await server.inject({
        method: 'POST',
        url: '/chat/match-ack/msg-1/respond',
        headers: withAuth(),
        payload: { acknowledge: true },
      });

      expect(response.statusCode).toBe(200);
      expect(mockChatService.respondToMatchAck).toBeCalledWith('msg-1', 1, true);
    });

    it('should decline match', async () => {
      mockChatService.respondToMatchAck.mockResolvedValueOnce({
        acknowledged: false, matchId: 'match-1', gameMode: 'classic',
      });

      const response = await server.inject({
        method: 'POST',
        url: '/chat/match-ack/msg-1/respond',
        headers: withAuth(),
        payload: { acknowledge: false },
      });

      expect(response.statusCode).toBe(200);
      expect(mockChatService.respondToMatchAck).toBeCalledWith('msg-1', 1, false);
    });

    it('should return 400 for non-boolean acknowledge', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/chat/match-ack/msg-1/respond',
        headers: withAuth(),
        payload: { acknowledge: 'yes' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should forward 410 for expired ack', async () => {
      mockChatService.respondToMatchAck.mockRejectedValueOnce(
        new ChatError(410, 'Match acknowledgement has expired')
      );

      const response = await server.inject({
        method: 'POST',
        url: '/chat/match-ack/msg-1/respond',
        headers: withAuth(),
        payload: { acknowledge: true },
      });

      expect(response.statusCode).toBe(410);
    });
  });
});
