import { ReactNode } from "react";

export function ProfilePictureContainer({ children }: { children: ReactNode }) {
    return (
        <div id='profile-picture' className="flex justify-center">
            <div className="flex flex-col">
                {children}
            </div>
        </div>
    )

}
