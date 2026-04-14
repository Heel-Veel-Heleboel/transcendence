import { ReactNode } from "react";
import { Terminal } from "../../components/layout/Terminal";

export function ChatContainer({ children }: { children: ReactNode }) {

    return (
        <div className="min-w-full min-h-4/5 border border-black">
            <Terminal title={'Chat'} >
                {children}
            </Terminal>
        </div>
    )
}
