import { JSX } from "react";
import { IFallbackErrorProps } from "../../shared/types/types";


export function GeneralErrorFallback({ error, resetErrorBoundary }: IFallbackErrorProps): JSX.Element {
    console.error('[GeneralErrorFallback]', error);
    return (
        <div role="alert">
            <p>Oops! Something went wrong.</p>
            <button onClick={resetErrorBoundary}>Try again</button>
        </div>
    );
}
