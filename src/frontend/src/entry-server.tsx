import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server';
import { Router } from './router'

/* v8 ignore start */
export function render({ path }: { path: string }) {
    const html = renderToString(
        <StrictMode>
            <StaticRouter location={path}>
                <Router />
            </StaticRouter >
        </StrictMode>,
    )
    return { html }
}
/* v8 ignore stop */
