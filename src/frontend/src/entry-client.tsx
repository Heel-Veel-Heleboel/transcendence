import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import { Router } from './router';

/* v8 ignore start */
hydrateRoot(
    document.getElementById('root') as HTMLElement,
    <StrictMode>
        <BrowserRouter>
            <Router />
        </BrowserRouter>
    </StrictMode>,
)

/* v8 ignore stop */
