/**
 * Logger for application startup and configuration parsing
 * Uses Pino with ECS format for Elasticsearch compatibility
 *
 * Logs are written in ECS JSON format to:
 * - Console (pino-pretty in development for readability)
 * - Log file (logs/api-gateway.log) for Filebeat to ship to Elasticsearch
 */
import pino from 'pino';
import { ecsFormat } from '@elastic/ecs-pino-format';

export function getLoggerConfig(): pino.LoggerOptions {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  // In development: use pino-pretty for readable console output
  if (isDevelopment) {
    return {
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname'
        }
      }
    };
  }

  // In production: use ECS format for Elasticsearch
  return ecsFormat({
    convertReqRes: true,
    serviceName: 'api-gateway',
    serviceVersion: process.env.npm_package_version || '1.0.0'
  });
}

export const logger = pino(getLoggerConfig());
