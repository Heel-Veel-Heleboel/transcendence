import { JSX } from "react";
import { IFallbackErrorProps } from "../../shared/types/types";

export function FeatureErrorFallback({ error, resetErrorBoundary }: IFallbackErrorProps): JSX.Element {
    return (
        <div role="alert" className="p-4 text-center">
            <p>Something went wrong in this section.</p>
            <pre className="text-sm mt-2 mb-4">{error?.message}</pre>
            <button onClick={resetErrorBoundary}>Retry</button>
        </div>
    );
}
