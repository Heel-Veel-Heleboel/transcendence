import { ReactNode } from "react";
import { Animation } from "./Animation";

export function LoginContainer({ children }: { children: ReactNode }) {
    return (
        <div id='login-page' className="min-h-full grow">
            <Animation />
            <div className="h-screen">
                {children}
            </div >
        </div >
    )
}
