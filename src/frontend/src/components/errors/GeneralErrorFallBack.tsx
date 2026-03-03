import { JSX } from "react";
import { FallbackErrorProps } from "../../types/types";


export function GeneralErrorFallback({ error, resetErrorBoundary }: FallbackErrorProps): JSX.Element {
    return (
        <div role="alert">
            <p>Oops! Something went wrong:</p>
            <pre >{error.message}</pre>
            <button onClick={resetErrorBoundary}>Try again</button>
        </div>
    );
}
