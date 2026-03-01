import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import websocketPlugin from '@fastify/websocket';
import WebSocket from 'ws';
import { websocketRoutes } from '../../src/websocket/handler';

// Mock verifyToken to avoid needing real JWT keys
vi.mock('../../src/middleware/auth', () => ({
  verifyToken: vi.fn((token: string) => {
    if (token === 'valid-token') return { sub: 42, user_email: 'test@test.com' };
    if (token === 'valid-token-2') return { sub: 99, user_email: 'other@test.com' };
    return null;
  })
}));

function connectWs(port: number): WebSocket {
  return new WebSocket(`ws://localhost:${port}/ws`);
}

function waitForMessage(ws: WebSocket): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out waiting for message')), 3000);
    ws.once('message', (data) => {
      clearTimeout(timer);
      resolve(data.toString());
    });
  });
}

function waitForClose(ws: WebSocket): Promise<{ code: number; reason: string }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out waiting for close')), 3000);
    ws.once('close', (code, reason) => {
      clearTimeout(timer);
      resolve({ code, reason: reason.toString() });
    });
  });
}

function waitForOpen(ws: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out waiting for open')), 3000);
    ws.once('open', () => {
      clearTimeout(timer);
      resolve();
    });
    ws.once('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

describe('WebSocket Handler', () => {
  let app: FastifyInstance;
  let port: number;
  const openSockets: WebSocket[] = [];

  beforeAll(async () => {
    app = Fastify({ logger: false });
    await app.register(websocketPlugin);
    await websocketRoutes(app);
    await app.listen({ port: 0, host: '127.0.0.1' });
    const address = app.server.address();
    port = typeof address === 'object' && address ? address.port : 0;
  });

  afterEach(() => {
    for (const ws of openSockets) {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    }
    openSockets.length = 0;
  });

  afterAll(async () => {
    await app.close();
  });

  function createWs(): WebSocket {
    const ws = connectWs(port);
    openSockets.push(ws);
    return ws;
  }

  describe('Authentication', () => {
    it('should respond with AUTH_OK for valid token', async () => {
      const ws = createWs();
      await waitForOpen(ws);

      const msgPromise = waitForMessage(ws);
      ws.send(JSON.stringify({ type: 'AUTH', token: 'valid-token' }));
      const response = JSON.parse(await msgPromise);

      expect(response.type).toBe('AUTH_OK');
    });

    it('should close with 4003 for invalid token', async () => {
      const ws = createWs();
      await waitForOpen(ws);

      const closePromise = waitForClose(ws);
      ws.send(JSON.stringify({ type: 'AUTH', token: 'bad-token' }));
      const { code, reason } = await closePromise;

      expect(code).toBe(4003);
      expect(reason).toBe('Invalid token');
    });

    it('should close with 4002 when first message is not AUTH type', async () => {
      const ws = createWs();
      await waitForOpen(ws);

      const closePromise = waitForClose(ws);
      ws.send(JSON.stringify({ type: 'HELLO' }));
      const { code, reason } = await closePromise;

      expect(code).toBe(4002);
      expect(reason).toBe('Expected AUTH message with token');
    });

    it('should close with 4002 when AUTH message has no token', async () => {
      const ws = createWs();
      await waitForOpen(ws);

      const closePromise = waitForClose(ws);
      ws.send(JSON.stringify({ type: 'AUTH' }));
      const { code, reason } = await closePromise;

      expect(code).toBe(4002);
      expect(reason).toBe('Expected AUTH message with token');
    });

    it('should close with 4002 for invalid JSON', async () => {
      const ws = createWs();
      await waitForOpen(ws);

      const closePromise = waitForClose(ws);
      ws.send('not-json{{{');
      const { code, reason } = await closePromise;

      expect(code).toBe(4002);
      expect(reason).toBe('Invalid message format');
    });
  });

  describe('Message size limit', () => {
    it('should close with 4005 when message exceeds max size', async () => {
      const ws = createWs();
      await waitForOpen(ws);

      const closePromise = waitForClose(ws);
      ws.send('x'.repeat(5000));
      const { code, reason } = await closePromise;

      expect(code).toBe(4005);
      expect(reason).toBe('Message too large');
    });
  });

  describe('Binary frames', () => {
    it('should close with 4004 for binary frames', async () => {
      const ws = createWs();
      await waitForOpen(ws);

      const closePromise = waitForClose(ws);
      ws.send(Buffer.from([0x00, 0x01, 0x02]), { binary: true });
      const { code, reason } = await closePromise;

      expect(code).toBe(4004);
      expect(reason).toBe('Binary frames not supported');
    });
  });

  describe('Post-authentication', () => {
    it('should stay connected after successful auth', async () => {
      const ws = createWs();
      await waitForOpen(ws);

      const msgPromise = waitForMessage(ws);
      ws.send(JSON.stringify({ type: 'AUTH', token: 'valid-token' }));
      await msgPromise;

      // Connection should still be open
      expect(ws.readyState).toBe(WebSocket.OPEN);
    });

    it('should handle post-auth messages without crashing', async () => {
      const ws = createWs();
      await waitForOpen(ws);

      const msgPromise = waitForMessage(ws);
      ws.send(JSON.stringify({ type: 'AUTH', token: 'valid-token' }));
      await msgPromise;

      // Send a message that doesn't match any handler - should not crash or close
      ws.send(JSON.stringify({ type: 'UNKNOWN_TYPE' }));

      // Wait a bit and verify connection is still open
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(ws.readyState).toBe(WebSocket.OPEN);
    });
  });

  describe('Connection cleanup', () => {
    it('should handle client disconnect gracefully', async () => {
      const ws = createWs();
      await waitForOpen(ws);

      const msgPromise = waitForMessage(ws);
      ws.send(JSON.stringify({ type: 'AUTH', token: 'valid-token' }));
      await msgPromise;

      const closePromise = waitForClose(ws);
      ws.close();
      const { code } = await closePromise;

      // 1000 = normal closure, 1005 = no status code in close frame (both are valid)
      expect([1000, 1005]).toContain(code);
    });

    it('should handle disconnect before authentication', async () => {
      const ws = createWs();
      await waitForOpen(ws);

      const closePromise = waitForClose(ws);
      ws.close();
      const { code } = await closePromise;

      expect([1000, 1005]).toContain(code);
    });
  });
});
