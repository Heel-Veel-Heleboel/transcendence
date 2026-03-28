/**
 * Logger configuration for Fastify
 * Uses Pino (same as Fastify) for consistent logging
 */
import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

const productionTransport = {
  targets: [
    {
      target: 'pino/file',
      level: process.env.LOG_LEVEL || 'info',
      options: { destination: 1 } // stdout
    },
    {
      target: 'pino-socket',
      level: process.env.LOG_LEVEL || 'info',
      options: {
        address: process.env.LOGSTASH_HOST || 'logstash',
        port: parseInt(process.env.LOGSTASH_PORT || '5044'),
        mode: 'tcp'
      }
    }
  ]
};

const developmentTransport = {
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'HH:MM:ss',
    ignore: 'pid,hostname'
  }
};

// Logger options that can be passed to Fastify
export const loggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  name: 'api-gateway',
  transport: isProduction ? productionTransport : developmentTransport
};

// Logger instance for use outside Fastify
export const logger = pino(loggerOptions);
