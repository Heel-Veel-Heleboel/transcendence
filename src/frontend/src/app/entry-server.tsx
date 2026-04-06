import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server';
import { App } from './App.tsx';
import { Logger } from 'pino';

/* v8 ignore start */
export function render({ path, logger }: { path: string, logger: Logger<never, boolean> }) {
    path === undefined ? logger.info({ path: '' }, 'path rendered') : logger.info({ path: path }, 'path rendered');
    const html = renderToString(
        <StrictMode>
            <StaticRouter location={path}>
                <App />
            </StaticRouter >
        </StrictMode>,
    )
    logger.info('server-side rendered output');
    logger.info({ msg: 'server-side rendered output\n' + html });
    return { html }
}
/* v8 ignore stop */
