import { ReactNode } from "react";

export function ProfileAvatarContainer({ children }: { children: ReactNode }) {
    return (
        <div id="profile-avatar" className="w-1/2 min-h-full flex flex-col justify-around text-xl">
            <div className="h-3/5">
                <div className="min-h-full flex flex-col justify-between">
                    {children}
                </div>
            </div>
        </div>
    )
}
