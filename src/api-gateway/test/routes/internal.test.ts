import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';

vi.mock('../../src/websocket/connections', () => ({
  sendToUsers: vi.fn((userIds: string[]) =>
    userIds.map(userId => ({ userId, delivered: false }))
  )
}));

import { sendToUsers } from '../../src/websocket/connections';
import { internalRoutes } from '../../src/routes/internal';

const mockedSendToUsers = vi.mocked(sendToUsers);

describe('Internal Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    await internalRoutes(app);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /internal/ws/notify', () => {
    it('should return 400 when body is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/internal/ws/notify',
        headers: { 'content-type': 'application/json' },
        payload: ''
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when userIds is not an array', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/internal/ws/notify',
        payload: { userIds: 'not-an-array', event: { type: 'TEST' } }
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('userIds must be a non-empty array');
    });

    it('should return 400 when userIds is an empty array', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/internal/ws/notify',
        payload: { userIds: [], event: { type: 'TEST' } }
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('userIds must be a non-empty array');
    });

    it('should return 400 when event is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/internal/ws/notify',
        payload: { userIds: ['user1'] }
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('event must have a type field');
    });

    it('should return 400 when event.type is not a string', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/internal/ws/notify',
        payload: { userIds: ['user1'], event: { type: 123 } }
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('event must have a type field');
    });

    it('should call sendToUsers and return results for valid request', async () => {
      mockedSendToUsers.mockReturnValueOnce([
        { userId: 'user1', delivered: true },
        { userId: 'user2', delivered: false }
      ]);

      const response = await app.inject({
        method: 'POST',
        url: '/internal/ws/notify',
        payload: {
          userIds: ['user1', 'user2'],
          event: { type: 'MATCH_FOUND', data: { matchId: '123' } }
        }
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.results).toHaveLength(2);
      expect(body.results[0]).toEqual({ userId: 'user1', delivered: true });
      expect(body.results[1]).toEqual({ userId: 'user2', delivered: false });

      expect(mockedSendToUsers).toHaveBeenCalledWith(
        ['user1', 'user2'],
        { type: 'MATCH_FOUND', data: { matchId: '123' } }
      );
    });

    it('should handle single user notification', async () => {
      mockedSendToUsers.mockReturnValueOnce([
        { userId: 'user1', delivered: true }
      ]);

      const response = await app.inject({
        method: 'POST',
        url: '/internal/ws/notify',
        payload: {
          userIds: ['user1'],
          event: { type: 'GAME_START' }
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().results).toHaveLength(1);
    });
  });
});
