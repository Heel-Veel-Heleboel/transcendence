import { ReactNode } from "react";

export function ProfilePictureContainer({ children }: { children: ReactNode }) {
    return (
        <div id='profile-picture' className="flex justify-center min-h-full">
            <div className="flex flex-col min-h-full">
                {children}
            </div>
        </div>
    )

}
