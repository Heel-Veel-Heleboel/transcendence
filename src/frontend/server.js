import fs from 'node:fs/promises';
import express from 'express';
import { pino } from 'pino';
import { getCookie, getCookieFromString } from './src/shared/utils/cookies.ts';

/* v8 ignore start */
// Constants
const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 5173;
const base = process.env.BASE || '/';

// Cached production assets
const templateHtml = isProduction
  ? await fs.readFile('./dist/client/index.html', 'utf-8')
  : '';

// Create http server
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
  app.use(base, sirv('./dist/client', { extensions: [] }));
}

// Serve HTML
app.use('*all', async (req, res) => {
  const childLogger = logger.child({ logging_url: req.originalUrl });
  childLogger.info(req, 'request received');
  const url = req.originalUrl;
  try {
    /** @type {string} */
    let template;
    /** @type {import('./src/entry-server.ts').render} */
    // let render;
    if (!isProduction) {
      // Always read fresh template in development
      template = await fs.readFile('./index.html', 'utf-8');
      template = await vite.transformIndexHtml(url, template);
      // render = (await vite.ssrLoadModule('/src/app/entry-server.tsx')).render;
    } else {
      template = templateHtml;
      // render = (await import('./dist/server/entry-server.js')).render;
    }

    // childLogger.info({ url: url }, 'url to be rendered');
    // const userId = getCookieFromString('user_id', req.headers.cookie);
    // const rendered = await render({ url, userId, logger });

    // const html = template
    //   .replace(`<!--app-head-->`, rendered.head ?? '')
    //   .replace(`<!--app-html-->`, rendered.html ?? '');
    // childLogger.info({ msg: 'final constructed html\n' + html });
    res.status(200).set({ 'Content-Type': 'text/html' }).send(template);
    // childLogger.info(res, 'response');
  } catch (e) {
    vite?.ssrFixStacktrace(e);
    // childLogger.error(e, 'error in request');
    res.status(500).end(e.stack);
  }
});

// Start http server
app.listen(port, () => {
  logger.info(`Server started at http://localhost:${port}`);
});
/* v8 ignore stop */
