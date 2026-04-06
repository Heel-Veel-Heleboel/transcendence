import { JSX } from "react";
import { IFallbackErrorProps } from "../../shared/types/types";


export function GeneralErrorFallback({ error, resetErrorBoundary }: IFallbackErrorProps): JSX.Element {
    return (
        <div role="alert">
            <p>Oops! Something went wrong:</p>
            <pre >{error.message}</pre>
            <button onClick={resetErrorBoundary}>Try again</button>
        </div>
    );
}
