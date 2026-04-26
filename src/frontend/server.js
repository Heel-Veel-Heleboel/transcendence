import fs from 'node:fs/promises';
import express from 'express';
import pino from 'pino';

/* v8 ignore start */
const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 5173;
const base = process.env.BASE || '/';

// Cached production assets
const templateHtml = isProduction
  ? await fs.readFile('./dist/index.html', 'utf-8')
  : '';

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

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  name: 'frontend',
  transport: isProduction ? productionTransport : developmentTransport
});

const app = express();

// Add Vite or respective production middlewares
/** @type {import('vite').ViteDevServer | undefined} */
let vite;
if (!isProduction) {
  const { createServer } = await import('vite');
  vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    base
  });
  app.use(vite.middlewares);
} else {
  const compression = (await import('compression')).default;
  const sirv = (await import('sirv')).default;
  app.use(compression());
  app.use(base, sirv('./dist', { extensions: [] }));
}

app.use('*all', async (req, res) => {
  const childLogger = logger.child({ url: req.originalUrl });
  childLogger.info('request received');
  const url = req.originalUrl;
  try {
    let template;
    if (!isProduction) {
      template = await fs.readFile('./index.html', 'utf-8');
      template = await vite.transformIndexHtml(url, template);
    } else {
      template = templateHtml;
    }

    res.status(200).set({ 'Content-Type': 'text/html' }).send(template);
    childLogger.info({ statusCode: 200 }, 'response sent');
  } catch (e) {
    vite?.ssrFixStacktrace(e);
    childLogger.error({ err: e }, 'error handling request');
    res.status(500).end(e.stack);
  }
});

app.listen(port, () => {
  logger.info({ port }, 'server started');
});
/* v8 ignore end */
