import { ReactNode } from "react";

export function FormContainer({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-full text-white text-center flex flex-col justify-around bg-zinc-400/60 border font-orbi">
            {children}
        </div>
    )

}
