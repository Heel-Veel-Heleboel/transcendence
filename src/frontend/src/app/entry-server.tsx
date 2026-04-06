import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server';
import { App } from './App.tsx';

/* v8 ignore start */
export function render({ path }: { path: string }) {
    const html = renderToString(
        <StrictMode>
            <StaticRouter location={path}>
                <App />
            </StaticRouter >
        </StrictMode>,
    )
    console.log('serverside: ' + html);
    return { html }
}
/* v8 ignore stop */
