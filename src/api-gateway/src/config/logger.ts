/**
 * Logger configuration for Fastify
 * Uses Pino (same as Fastify) for consistent logging
 */
import pino from 'pino';

// Logger options that can be passed to Fastify
export const loggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname'
        }
      }
      : undefined
};

// Logger instance for use outside Fastify
export const logger = pino(loggerOptions);
