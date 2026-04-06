import { JSX, ReactNode } from "react";

export function CenterFlexContainer({ children }: { children: ReactNode }): JSX.Element {
    return (
        <div className="flex justify-between min-h-full grow">
            <div />
            {children}
            <div />
        </div>
    )
}
