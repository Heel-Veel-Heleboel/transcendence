import { ReactNode } from "react";
import { htmlIdefier } from "../../shared/utils/html";

export function BorderHoverContainer({ title, children }: { title: string, children: ReactNode }) {

    return (
        <div id={`${htmlIdefier(title)}-border-container`} className="min-h-full w-full hover:border-orange-300 hover:border hover:border-2">
            {children}
        </div>
    )
}
