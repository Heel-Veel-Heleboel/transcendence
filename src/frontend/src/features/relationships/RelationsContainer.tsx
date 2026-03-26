import { ReactNode } from "react";

export function RelationsContainer({ children }: { children: ReactNode }) {
    return (
        <div id='relationship-container' className="flex flex-col min-w-full min-h-full bg-blue-500/50 text-center justify-between">
            <div />
            <div id="relationship-content" className="flex min-w-full h-8/10 justify-around">
                {children}
            </div>
            <div />
        </div>
    )
}
