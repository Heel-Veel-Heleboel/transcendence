import { NotificationService } from '../../src/services/notification.js';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const mockChannelDao = {
  getMemberIds: vi.fn(),
};

const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};

describe('NotificationService', () => {
  let service: NotificationService;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchSpy);
    service = new NotificationService(mockChannelDao as any, mockLogger);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('notifyUsers', () => {
    it('should POST to gateway internal notify endpoint', async () => {
      await service.notifyUsers([1, 2], { type: 'chat:message', content: 'hi' });

      expect(fetchSpy).toBeCalledWith('http://localhost:3002/internal/ws/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: ['1', '2'],
          event: { type: 'chat:message', content: 'hi' },
        }),
      });
    });

    it('should convert user IDs to strings', async () => {
      await service.notifyUsers([42], { type: 'test' });

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.userIds).toEqual(['42']);
    });

    it('should log warning on non-OK response', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: false, status: 500 });

      await service.notifyUsers([1], { type: 'test' });

      expect(mockLogger.warn).toBeCalledWith(
        { status: 500, event: 'test' },
        'Gateway notify returned non-OK'
      );
    });

    it('should log error on fetch failure and not throw', async () => {
      const error = new Error('Connection refused');
      fetchSpy.mockRejectedValueOnce(error);

      await expect(service.notifyUsers([1], { type: 'test' })).resolves.toBeUndefined();

      expect(mockLogger.error).toBeCalledWith(
        { error, event: 'test' },
        'Failed to notify via gateway'
      );
    });
  });

  describe('notifyChannelMembers', () => {
    it('should fetch member IDs and notify all members', async () => {
      mockChannelDao.getMemberIds.mockResolvedValueOnce([1, 2, 3]);

      await service.notifyChannelMembers('ch-1', { type: 'chat:message' });

      expect(mockChannelDao.getMemberIds).toBeCalledWith('ch-1');
      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.userIds).toEqual(['1', '2', '3']);
    });

    it('should exclude specified user ID', async () => {
      mockChannelDao.getMemberIds.mockResolvedValueOnce([1, 2, 3]);

      await service.notifyChannelMembers('ch-1', { type: 'chat:message' }, 2);

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.userIds).toEqual(['1', '3']);
    });

    it('should not call fetch if no members remain after exclusion', async () => {
      mockChannelDao.getMemberIds.mockResolvedValueOnce([1]);

      await service.notifyChannelMembers('ch-1', { type: 'chat:message' }, 1);

      expect(fetchSpy).not.toBeCalled();
    });

    it('should not call fetch if channel has no members', async () => {
      mockChannelDao.getMemberIds.mockResolvedValueOnce([]);

      await service.notifyChannelMembers('ch-1', { type: 'chat:message' });

      expect(fetchSpy).not.toBeCalled();
    });
  });
});
