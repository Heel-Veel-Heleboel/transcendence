import { JSX, ReactNode } from "react";
import { htmlIdefier } from "../../shared/utils/html";

export function Terminal({ title, children }: { title: string, children: ReactNode }): JSX.Element {
    return (
        <div id={`terminal-${htmlIdefier(title)}`} className="border min-h-full max-h-full flex flex-col">
            <div className="border border-t border-l border-r text-center">{title}</div>
            <div className="min-h-full max-h-full overflow-y-auto">
                {children}
            </div>
        </div>
    )
}
