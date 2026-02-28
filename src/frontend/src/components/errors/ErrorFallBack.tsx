import { JSX } from "react";
import { type FallbackProps } from 'react-error-boundary';

type FallbackErrorProps = Omit<FallbackProps, 'error'> & {
    error: any;
}

export function ErrorFallback({ error, resetErrorBoundary }: FallbackErrorProps): JSX.Element {
    return (
        <div role="alert">
            <p>Oops! Something went wrong:</p>
            <pre >{error.message}</pre>
            <button onClick={resetErrorBoundary}>Try again</button>
        </div>
    );
}
