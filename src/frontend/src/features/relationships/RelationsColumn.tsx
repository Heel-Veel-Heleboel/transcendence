
import { ReactNode } from "react";

export function RelationsColumn({ children }: { children: ReactNode }) {
    return (
        <div id='relationship-column' className="w-3/10">
            {children}
        </div>
    )
}
