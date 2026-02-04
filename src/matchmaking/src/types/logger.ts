/**
 * Logger interface for matchmaking service
 * Compatible with Pino and other structured loggers
 */
export interface Logger {
  info: (obj: object, msg?: string) => void;
  warn: (obj: object, msg?: string) => void;
  error: (obj: object, msg?: string) => void;
}
