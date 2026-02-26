import { BlockService } from '../../src/services/block.js';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};

describe('BlockService', () => {
  let service: BlockService;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    service = new BlockService(mockLogger);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('isBlocked', () => {
    it('should return true when friendship status is BLOCKED', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'BLOCKED' }),
      });

      const result = await service.isBlocked(1, 2);

      expect(fetchSpy).toBeCalledWith('http://localhost:3001/user/friendships/1/2');
      expect(result).toBe(true);
    });

    it('should return false when friendship status is ACCEPTED', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ACCEPTED' }),
      });

      const result = await service.isBlocked(1, 2);

      expect(result).toBe(false);
    });

    it('should return false on 404 (no friendship record)', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: false, status: 404 });

      const result = await service.isBlocked(1, 2);

      expect(result).toBe(false);
    });

    it('should return false and log warning on non-404 error response', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: false, status: 500 });

      const result = await service.isBlocked(1, 2);

      expect(result).toBe(false);
      expect(mockLogger.warn).toBeCalledWith(
        { status: 500 },
        'Failed to check block status'
      );
    });

    it('should return false and log error on fetch failure', async () => {
      const error = new Error('Connection refused');
      fetchSpy.mockRejectedValueOnce(error);

      const result = await service.isBlocked(1, 2);

      expect(result).toBe(false);
      expect(mockLogger.error).toBeCalledWith(
        { error, userId: 1, targetUserId: 2 },
        'Error checking block status'
      );
    });
  });

  describe('getBlockedUserIds', () => {
    it('should return list of blocked user IDs', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ blockedIds: [3, 5, 7] }),
      });

      const result = await service.getBlockedUserIds(1);

      expect(fetchSpy).toBeCalledWith('http://localhost:3001/user/friendships/1/blocked');
      expect(result).toEqual([3, 5, 7]);
    });

    it('should return empty array on non-OK response', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: false, status: 500 });

      const result = await service.getBlockedUserIds(1);

      expect(result).toEqual([]);
    });

    it('should return empty array when blockedIds is null', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ blockedIds: null }),
      });

      const result = await service.getBlockedUserIds(1);

      expect(result).toEqual([]);
    });

    it('should return empty array and log error on fetch failure', async () => {
      const error = new Error('Connection refused');
      fetchSpy.mockRejectedValueOnce(error);

      const result = await service.getBlockedUserIds(1);

      expect(result).toEqual([]);
      expect(mockLogger.error).toBeCalledWith(
        { error, userId: 1 },
        'Error fetching blocked users'
      );
    });
  });
});
