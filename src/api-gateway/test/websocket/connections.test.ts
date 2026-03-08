import { describe, it, expect, beforeEach } from 'vitest';
import {
  addConnection,
  removeConnection,
  sendToUser,
  sendToUsers,
  getConnectionCount,
} from '../../src/websocket/connections';

function createMockConnection(readyState: number = 1 /* OPEN */) {
  return {
    socket: {
      readyState,
      OPEN: 1,
      send: () => {},
    },
  } as any;
}

describe('WebSocket connections', () => {
  beforeEach(() => {
    // Clean up all connections by removing known test users
    // (the module uses a module-scoped Map, so we remove manually)
    for (const userId of ['1', '2', '3', '99']) {
      const conn = createMockConnection();
      addConnection(userId, conn);
      removeConnection(userId, conn);
    }
  });

  describe('sendToUser', () => {
    it('should return false when user has no connections', () => {
      expect(sendToUser('99', { type: 'test' })).toBe(false);
    });

    it('should return true and send message when user is connected', () => {
      const conn = createMockConnection();
      conn.socket.send = () => {};
      addConnection('1', conn);

      expect(sendToUser('1', { type: 'test' })).toBe(true);

      removeConnection('1', conn);
    });
  });

  describe('sendToUsers', () => {
    it('should return delivery status for each user', () => {
      const conn = createMockConnection();
      addConnection('1', conn);

      const results = sendToUsers(['1', '99'], { type: 'test' });

      expect(results).toEqual([
        { userId: '1', delivered: true },
        { userId: '99', delivered: false },
      ]);

      removeConnection('1', conn);
    });
  });

  describe('getConnectionCount', () => {
    it('should count all active connections', () => {
      const conn1 = createMockConnection();
      const conn2 = createMockConnection();
      addConnection('1', conn1);
      addConnection('2', conn2);

      expect(getConnectionCount()).toBeGreaterThanOrEqual(2);

      removeConnection('1', conn1);
      removeConnection('2', conn2);
    });
  });
});
