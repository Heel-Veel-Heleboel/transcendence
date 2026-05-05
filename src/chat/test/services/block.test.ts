import { BlockService } from '../../src/services/block.js';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};

const BASE_URL = 'http://localhost:3004';

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
    it('should return true when user has blocked target', async () => {
      fetchSpy
        .mockResolvedValueOnce({ ok: true, json: async () => ({ blocked: true }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ blocked: false }) });

      const result = await service.isBlocked(1, 2);

      expect(result).toBe(true);
      expect(fetchSpy).toBeCalledWith(`${BASE_URL}/users/friendship/is-blocked-by/1/2`);
    });

    it('should return true when target has blocked user', async () => {
      fetchSpy
        .mockResolvedValueOnce({ ok: true, json: async () => ({ blocked: false }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ blocked: true }) });

      const result = await service.isBlocked(1, 2);

      expect(result).toBe(true);
    });

    it('should return false when neither has blocked the other', async () => {
      fetchSpy
        .mockResolvedValueOnce({ ok: true, json: async () => ({ blocked: false }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ blocked: false }) });

      const result = await service.isBlocked(1, 2);

      expect(result).toBe(false);
    });

    it('should return false on 404 (no block record)', async () => {
      fetchSpy
        .mockResolvedValueOnce({ ok: false, status: 404 })
        .mockResolvedValueOnce({ ok: false, status: 404 });

      const result = await service.isBlocked(1, 2);

      expect(result).toBe(false);
    });

    it('should fail closed (return true) on non-404 error response', async () => {
      fetchSpy
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ blocked: false }) });

      const result = await service.isBlocked(1, 2);

      expect(result).toBe(true);
      expect(mockLogger.warn).toBeCalled();
    });

    it('should fail closed (return true) and log error when fetch throws', async () => {
      const error = new Error('Connection refused');
      fetchSpy.mockRejectedValue(error);

      const result = await service.isBlocked(1, 2);

      expect(result).toBe(true);
      expect(mockLogger.error).toBeCalled();
    });
  });

  describe('getBlockedUserIds', () => {
    it('should return list of blocked user IDs (only where user is requester)', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          { requester_id: 1, addressee_id: 3 },
          { requester_id: 2, addressee_id: 1 },
          { requester_id: 1, addressee_id: 5 },
        ]),
      });

      const result = await service.getBlockedUserIds(1);

      expect(fetchSpy).toBeCalledWith(
        `${BASE_URL}/users/friendship/find-all-by-status-for-user/1/BLOCKED`
      );
      expect(result).toEqual([3, 5]);
    });

    it('should return empty array on non-OK response', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: false, status: 500 });

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
