import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Security Configuration', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  describe('getBodyLimit', () => {
    it('should return default 1MB when BODY_LIMIT_BYTES is not set', async () => {
      delete process.env.BODY_LIMIT_BYTES;

      const { getBodyLimit } = await import('../../../src/api-gateway/src/config/security');
      expect(getBodyLimit()).toBe(1048576);
    });

    it('should return custom value from BODY_LIMIT_BYTES', async () => {
      process.env.BODY_LIMIT_BYTES = '2097152'; // 2MB

      const { getBodyLimit } = await import('../../../src/api-gateway/src/config/security');
      expect(getBodyLimit()).toBe(2097152);
    });

    it('should return default when BODY_LIMIT_BYTES is invalid', async () => {
      process.env.BODY_LIMIT_BYTES = 'invalid';

      const { getBodyLimit } = await import('../../../src/api-gateway/src/config/security');
      expect(getBodyLimit()).toBe(1048576);
    });

    it('should return default when BODY_LIMIT_BYTES is negative', async () => {
      process.env.BODY_LIMIT_BYTES = '-1';

      const { getBodyLimit } = await import('../../../src/api-gateway/src/config/security');
      expect(getBodyLimit()).toBe(1048576);
    });

    it('should return default when BODY_LIMIT_BYTES is zero', async () => {
      process.env.BODY_LIMIT_BYTES = '0';

      const { getBodyLimit } = await import('../../../src/api-gateway/src/config/security');
      expect(getBodyLimit()).toBe(1048576);
    });
  });

  describe('Helmet Configuration', () => {
    it('should use default HSTS max-age when not set', async () => {
      delete process.env.HSTS_MAX_AGE;

      const { helmetConfig } = await import('../../../src/api-gateway/src/config/security');
      if (typeof helmetConfig.hsts === 'object') {
        expect(helmetConfig.hsts.maxAge).toBe(31536000); // 1 year
      }
    });

    it('should use custom HSTS max-age from environment', async () => {
      process.env.HSTS_MAX_AGE = '63072000'; // 2 years

      const { helmetConfig } = await import('../../../src/api-gateway/src/config/security');
      if (typeof helmetConfig.hsts === 'object') {
        expect(helmetConfig.hsts.maxAge).toBe(63072000);
      }
    });

    it('should use default when HSTS_MAX_AGE is invalid', async () => {
      process.env.HSTS_MAX_AGE = 'invalid';

      const { helmetConfig } = await import('../../../src/api-gateway/src/config/security');
      if (typeof helmetConfig.hsts === 'object') {
        expect(helmetConfig.hsts.maxAge).toBe(31536000);
      }
    });

    it('should use default when HSTS_MAX_AGE is negative', async () => {
      process.env.HSTS_MAX_AGE = '-1';

      const { helmetConfig } = await import('../../../src/api-gateway/src/config/security');
      if (typeof helmetConfig.hsts === 'object') {
        expect(helmetConfig.hsts.maxAge).toBe(31536000);
      }
    });

    it('should include subdomains by default', async () => {
      delete process.env.HSTS_INCLUDE_SUBDOMAINS;

      const { helmetConfig } = await import('../../../src/api-gateway/src/config/security');
      if (typeof helmetConfig.hsts === 'object') {
        expect(helmetConfig.hsts.includeSubDomains).toBe(true);
      }
    });

    it('should disable subdomains when set to false', async () => {
      process.env.HSTS_INCLUDE_SUBDOMAINS = 'false';

      const { helmetConfig } = await import('../../../src/api-gateway/src/config/security');
      if (typeof helmetConfig.hsts === 'object') {
        expect(helmetConfig.hsts.includeSubDomains).toBe(false);
      }
    });

    it('should enable preload by default', async () => {
      delete process.env.HSTS_PRELOAD;

      const { helmetConfig } = await import('../../../src/api-gateway/src/config/security');
      if (typeof helmetConfig.hsts === 'object') {
        expect(helmetConfig.hsts.preload).toBe(true);
      }
    });

    it('should disable preload when set to false', async () => {
      process.env.HSTS_PRELOAD = 'false';

      const { helmetConfig } = await import('../../../src/api-gateway/src/config/security');
      if (typeof helmetConfig.hsts === 'object') {
        expect(helmetConfig.hsts.preload).toBe(false);
      }
    });
  });

  describe('CSP Configuration', () => {
    it('should use default CSP directives when not set', async () => {
      delete process.env.CSP_DEFAULT_SRC;
      delete process.env.CSP_STYLE_SRC;
      delete process.env.CSP_SCRIPT_SRC;
      delete process.env.CSP_IMG_SRC;

      const { helmetConfig } = await import('../../../src/api-gateway/src/config/security');
      if (typeof helmetConfig.contentSecurityPolicy === 'object') {
        expect(helmetConfig.contentSecurityPolicy.directives?.defaultSrc).toEqual(["'self'"]);
        expect(helmetConfig.contentSecurityPolicy.directives?.styleSrc).toEqual(["'self'"]);
        expect(helmetConfig.contentSecurityPolicy.directives?.scriptSrc).toEqual(["'self'"]);
        expect(helmetConfig.contentSecurityPolicy.directives?.imgSrc).toEqual(["'self'", 'data:', 'https:']);
      }
    });

    it('should parse comma-separated CSP_DEFAULT_SRC', async () => {
      process.env.CSP_DEFAULT_SRC = "'self','unsafe-eval'";

      const { helmetConfig } = await import('../../../src/api-gateway/src/config/security');
      if (typeof helmetConfig.contentSecurityPolicy === 'object') {
        expect(helmetConfig.contentSecurityPolicy.directives?.defaultSrc).toContain("'self'");
        expect(helmetConfig.contentSecurityPolicy.directives?.defaultSrc).toContain("'unsafe-eval'");
      }
    });

    it('should parse comma-separated CSP_STYLE_SRC', async () => {
      process.env.CSP_STYLE_SRC = "'self',https://cdn.example.com";

      const { helmetConfig } = await import('../../../src/api-gateway/src/config/security');
      if (typeof helmetConfig.contentSecurityPolicy === 'object') {
        expect(helmetConfig.contentSecurityPolicy.directives?.styleSrc).toContain("'self'");
        expect(helmetConfig.contentSecurityPolicy.directives?.styleSrc).toContain('https://cdn.example.com');
      }
    });

    it('should parse comma-separated CSP_SCRIPT_SRC', async () => {
      process.env.CSP_SCRIPT_SRC = "'self',https://cdn.example.com";

      const { helmetConfig } = await import('../../../src/api-gateway/src/config/security');
      if (typeof helmetConfig.contentSecurityPolicy === 'object') {
        expect(helmetConfig.contentSecurityPolicy.directives?.scriptSrc).toContain("'self'");
        expect(helmetConfig.contentSecurityPolicy.directives?.scriptSrc).toContain('https://cdn.example.com');
      }
    });

    it('should parse comma-separated CSP_IMG_SRC', async () => {
      process.env.CSP_IMG_SRC = "'self',https:";

      const { helmetConfig } = await import('../../../src/api-gateway/src/config/security');
      if (typeof helmetConfig.contentSecurityPolicy === 'object') {
        expect(helmetConfig.contentSecurityPolicy.directives?.imgSrc).toContain("'self'");
        expect(helmetConfig.contentSecurityPolicy.directives?.imgSrc).toContain('https:');
      }
    });
  });

  describe('CORS Configuration', () => {
    it('should use default allowed origins when not set', async () => {
      delete process.env.ALLOWED_ORIGINS;

      const { corsConfig } = await import('../../../src/api-gateway/src/config/security');
      expect(corsConfig.origin).toEqual(['http://localhost:8080', 'http://localhost:3000']);
    });

    it('should parse and trim comma-separated ALLOWED_ORIGINS', async () => {
      process.env.ALLOWED_ORIGINS = ' https://example.com , https://app.example.com ';

      const { corsConfig } = await import('../../../src/api-gateway/src/config/security');
      expect(corsConfig.origin).toEqual(['https://example.com', 'https://app.example.com']);
    });

    it('should enable credentials by default', async () => {
      delete process.env.CORS_CREDENTIALS;

      const { corsConfig } = await import('../../../src/api-gateway/src/config/security');
      expect(corsConfig.credentials).toBe(true);
    });

    it('should disable credentials when set to false', async () => {
      process.env.CORS_CREDENTIALS = 'false';

      const { corsConfig } = await import('../../../src/api-gateway/src/config/security');
      expect(corsConfig.credentials).toBe(false);
    });

    it('should use default allowed methods when not set', async () => {
      delete process.env.CORS_ALLOWED_METHODS;

      const { corsConfig } = await import('../../../src/api-gateway/src/config/security');
      expect(corsConfig.methods).toEqual(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']);
    });

    it('should parse and trim comma-separated CORS_ALLOWED_METHODS', async () => {
      process.env.CORS_ALLOWED_METHODS = ' GET , POST , DELETE ';

      const { corsConfig } = await import('../../../src/api-gateway/src/config/security');
      expect(corsConfig.methods).toEqual(['GET', 'POST', 'DELETE']);
    });

    it('should use default allowed headers when not set', async () => {
      delete process.env.CORS_ALLOWED_HEADERS;

      const { corsConfig } = await import('../../../src/api-gateway/src/config/security');
      expect(corsConfig.allowedHeaders).toEqual(['Content-Type', 'Authorization', 'X-Correlation-Id']);
    });

    it('should parse and trim comma-separated CORS_ALLOWED_HEADERS', async () => {
      process.env.CORS_ALLOWED_HEADERS = ' Content-Type , Authorization ';

      const { corsConfig } = await import('../../../src/api-gateway/src/config/security');
      expect(corsConfig.allowedHeaders).toEqual(['Content-Type', 'Authorization']);
    });

    it('should use default exposed headers when not set', async () => {
      delete process.env.CORS_EXPOSED_HEADERS;

      const { corsConfig } = await import('../../../src/api-gateway/src/config/security');
      expect(corsConfig.exposedHeaders).toEqual(['X-Correlation-Id']);
    });

    it('should parse and trim comma-separated CORS_EXPOSED_HEADERS', async () => {
      process.env.CORS_EXPOSED_HEADERS = ' X-Request-Id , X-Response-Time ';

      const { corsConfig } = await import('../../../src/api-gateway/src/config/security');
      expect(corsConfig.exposedHeaders).toEqual(['X-Request-Id', 'X-Response-Time']);
    });
  });

  describe('logSecurityConfig', () => {
    it('should execute without throwing errors', async () => {
      const mockLogger = { info: vi.fn() };
      const { logSecurityConfig } = await import('../../../src/api-gateway/src/config/security');
      expect(() => logSecurityConfig(mockLogger)).not.toThrow();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          bodyLimitBytes: expect.any(Number),
          corsOrigins: expect.any(Array)
        }),
        'Security configuration loaded'
      );
    });

    it('should log configuration with default values', async () => {
      delete process.env.BODY_LIMIT_BYTES;
      delete process.env.HSTS_MAX_AGE;
      delete process.env.HSTS_INCLUDE_SUBDOMAINS;
      delete process.env.HSTS_PRELOAD;
      delete process.env.CSP_DEFAULT_SRC;
      delete process.env.ALLOWED_ORIGINS;
      delete process.env.CORS_CREDENTIALS;

      const mockLogger = { info: vi.fn() };
      const { logSecurityConfig } = await import('../../../src/api-gateway/src/config/security');
      expect(() => logSecurityConfig(mockLogger)).not.toThrow();
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });
});
