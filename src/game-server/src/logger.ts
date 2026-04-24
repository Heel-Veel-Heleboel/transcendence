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
        mode: 'tcp',
        reconnect: true,
        reconnectTries: Infinity
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

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  name: 'game-server',
  transport: isProduction ? productionTransport : developmentTransport
});
