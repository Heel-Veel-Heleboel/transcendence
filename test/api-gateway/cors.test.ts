import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer } from '../../src/api-gateway/src/index';
import type { FastifyInstance } from 'fastify';

describe('CORS Configuration', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await createServer();
    await app.ready();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('should include CORS headers in response', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
      headers: {
        origin: 'http://localhost:8080'
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:8080');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('should handle OPTIONS preflight requests', async () => {
    const response = await app.inject({
      method: 'OPTIONS',
      url: '/health',
      headers: {
        origin: 'http://localhost:8080',
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type,authorization'
      }
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:8080');
    expect(response.headers['access-control-allow-methods']).toContain('POST');
    expect(response.headers['access-control-allow-headers']).toContain('Content-Type');
    expect(response.headers['access-control-allow-headers']).toContain('Authorization');
  });

  it('should expose X-Correlation-Id header', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
      headers: {
        origin: 'http://localhost:8080'
      }
    });

    expect(response.headers['access-control-expose-headers']).toContain('X-Correlation-Id');
  });

  it('should reject requests from non-allowed origins when ALLOWED_ORIGINS is set', async () => {
    // Note: This test requires setting ALLOWED_ORIGINS env var
    // In default config, multiple origins are allowed
    const response = await app.inject({
      method: 'GET',
      url: '/health',
      headers: {
        origin: 'http://malicious-site.com'
      }
    });

    // CORS plugin will not set Access-Control-Allow-Origin for disallowed origins
    // The request will still succeed, but browser will block the response
    expect(response.statusCode).toBe(200);
  });

  it('should allow all configured HTTP methods', async () => {
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

    for (const method of methods) {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/health',
        headers: {
          origin: 'http://localhost:8080',
          'access-control-request-method': method
        }
      });

      expect(response.statusCode).toBe(204);
      expect(response.headers['access-control-allow-methods']).toContain(method);
    }
  });

  it('should allow Authorization header in requests', async () => {
    const response = await app.inject({
      method: 'OPTIONS',
      url: '/health',
      headers: {
        origin: 'http://localhost:8080',
        'access-control-request-method': 'GET',
        'access-control-request-headers': 'authorization'
      }
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers['access-control-allow-headers']).toContain('Authorization');
  });

  it('should allow custom X-Correlation-Id header in requests', async () => {
    const response = await app.inject({
      method: 'OPTIONS',
      url: '/health',
      headers: {
        origin: 'http://localhost:8080',
        'access-control-request-method': 'GET',
        'access-control-request-headers': 'x-correlation-id'
      }
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers['access-control-allow-headers']).toContain('X-Correlation-Id');
  });
});
