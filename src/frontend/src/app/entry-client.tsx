import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { ErrorBoundary } from 'react-error-boundary';
import { GeneralErrorFallback } from '../features/errors/GeneralErrorFallBack';

/* v8 ignore start */
createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ErrorBoundary FallbackComponent={GeneralErrorFallback} >
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </ErrorBoundary  >
    </StrictMode>,
)

/* v8 ignore stop */
