import { GatewayConfig } from '../entities/common';

// Load configuration from environment variables
export const config: GatewayConfig = {
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'secret-key-change-in-production',
  
  // Service configurations
  services: [
    {
      name: 'user-service',
      upstream: process.env.USER_SERVICE_URL || 'http://user-service:3001',
      prefix: '/api/users',
      rewritePrefix: '/users',
      timeout: 5000,
      retries: 3
    },
    {
      name: 'game-service',
      upstream: process.env.GAME_SERVICE_URL || 'http://game-service:3002',
      prefix: '/api/games',
      rewritePrefix: '/games',
      timeout: 10000,
      retries: 2
    },
    {
      name: 'matchmaking-service',
      upstream: process.env.MATCHMAKING_SERVICE_URL || 'http://matchmaking-service:3003',
      prefix: '/api/matchmaking',
      rewritePrefix: '/matchmaking',
      timeout: 5000,
      retries: 3
    },
    {
      name: 'chat-service',
      upstream: process.env.CHAT_SERVICE_URL || 'http://chat-service:3004',
      prefix: '/api/chat',
      rewritePrefix: '/chat',
      timeout: 3000,
      retries: 2
    },
    {
      name: 'tournament-service',
      upstream: process.env.TOURNAMENT_SERVICE_URL || 'http://tournament-service:3005',
      prefix: '/api/tournaments',
      rewritePrefix: '/tournaments',
      timeout: 5000,
      retries: 3
    },
    {
      name: 'localization-service',
      upstream: process.env.LOCALIZATION_SERVICE_URL || 'http://localization-service:3006',
      prefix: '/api/localization',
      rewritePrefix: '/localization',
      timeout: 2000,
      retries: 1
    }
  ],

  // Rate limiting configuration
  rateLimits: {
    global: {
      max: 1000,
      timeWindow: '1 minute'
    },
    authenticated: {
      max: 2000,
      timeWindow: '1 minute'
    },
    endpoints: {
      '/api/auth/login': {
        max: 10,
        timeWindow: '1 minute'
      },
      '/api/games': {
        max: 500,
        timeWindow: '1 minute'
      },
      '/api/users': {
        max: 100,
        timeWindow: '1 minute'
      },
      '/api/chat': {
        max: 200,
        timeWindow: '1 minute'
      }
    }
  }
};

// Validate required environment variables
export function validateConfig(): void {
  const required = ['JWT_SECRET'];
  const missing = required.filter(key => !process.env[key] && config.nodeEnv === 'production');
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}


