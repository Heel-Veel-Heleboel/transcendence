import fs from 'node:fs/promises';
import express from 'express';
import { pino } from 'pino';

/* v8 ignore start */
const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 5173;
const base = process.env.BASE || '/';

// Cached production assets
const templateHtml = isProduction
  ? await fs.readFile('./dist/index.html', 'utf-8')
  : '';

const app = express();
const logger = pino();

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
  const childLogger = logger.child({ logging_url: req.originalUrl });
  childLogger.info(req, 'request received');
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
    childLogger.info(res, 'response');
  } catch (e) {
    vite?.ssrFixStacktrace(e);
    childLogger.error(e, 'error in request');
    res.status(500).end(e.stack);
  }
});

app.listen(port, () => {
  logger.info(`Server started at http://localhost:${port}`);
});
/* v8 ignore stop */
