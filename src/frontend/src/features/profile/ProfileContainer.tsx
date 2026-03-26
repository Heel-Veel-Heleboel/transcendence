import { ReactNode } from "react";

export function ProfileContainer({ children }: { children: ReactNode }) {
    return (
        <div id='avatar' className="flex min-w-full min-h-full bg-emerald-500/50 text-center">
            {children}
        </div>
    )
}
