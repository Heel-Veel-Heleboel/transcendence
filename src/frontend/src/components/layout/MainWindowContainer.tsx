import { ReactNode } from "react";
import { JSX } from "react/jsx-runtime";

export function MainWindowContainer({ children }: { children: ReactNode }): JSX.Element {
    return (
        <div id='main-window-container' className="min-w-full min-h-full flex flex-col">
            {children}
        </div>
    )
}
