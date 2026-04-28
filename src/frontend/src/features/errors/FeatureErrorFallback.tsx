import { JSX } from "react";
import { IFallbackErrorProps } from "../../shared/types/types";

export function FeatureErrorFallback({ error, resetErrorBoundary }: IFallbackErrorProps): JSX.Element {
    console.error('[FeatureErrorFallback]', error);
    return (
        <div role="alert" className="p-4 text-center">
            <p>Something went wrong in this section.</p>
            <button onClick={resetErrorBoundary}>Retry</button>
        </div>
    );
}
