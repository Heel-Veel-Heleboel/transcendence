import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server';
import { App } from './App.tsx';
import { Logger } from 'pino';
import { SsrProvider } from '../components/providers/Ssr.tsx';
import { ErrorBoundary } from 'react-error-boundary';
import { GeneralErrorFallback } from '../features/errors/GeneralErrorFallBack.tsx';

/* v8 ignore start */
export function render({ url, userId, logger }: { url: string, userId: string, logger: Logger<never, boolean> }) {
    typeof url === 'undefined' ? logger.info({ url: '' }, 'url rendered') : logger.info({ url: url }, 'url rendered');
    typeof userId === 'undefined' ? logger.info({ userId: '' }, 'userId header') : logger.info({ userId: userId }, 'userId header');
    try {
        const html = renderPage({ location: url, userId });
        return html
    } catch (e: any) {
        logger.error(e, 'rendering failed');
        return renderDefault(logger);
    }
}

export function renderPage({ location, userId }: { location: string, userId: string }) {
    const html = renderToString(
        <StrictMode>
            <ErrorBoundary FallbackComponent={GeneralErrorFallback} >
                <SsrProvider userId={userId} >
                    <StaticRouter location={location}>
                        <App />
                    </StaticRouter >
                </SsrProvider>
            </ErrorBoundary >
        </StrictMode>,
    )
    return (html);
}

export function renderDefault(logger: Logger<never, boolean>) {
    try {
        const html = renderPage({ location: '', userId: '' })
        return html
    } catch (e: any) {
        logger.error(e, 'rendering default failed after initial error');
        // TODO: add backup page here in case of 2nd render fail
        return ''
    }
}
/* v8 ignore stop */
