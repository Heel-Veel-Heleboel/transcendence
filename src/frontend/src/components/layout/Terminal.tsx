import { ReactNode } from "react";
import { htmlIdefier } from "../../shared/utils/html";

export function Terminal({ title, children }: { title: string, children: ReactNode }): JSX.Element {
    return (
        <div id={`terminal-${htmlIdefier(title)}`} className="border border-black min-h-full max-h-full flex flex-col">
            <div className="border border-black border-t border-l border-r text-center">{title}</div>
            <div className="min-h-full max-h-full overflow-auto">
                {children}
            </div>
        </div>
    )
}
