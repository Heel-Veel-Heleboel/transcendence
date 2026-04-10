import { ReactNode } from "react";
import { Terminal } from "../../components/layout/Terminal";

export function ChatContainer({ children }: { children: ReactNode }) {

    return (
        <div className="w-4/6 min-h-full border border-black">
            <Terminal title={'Chat'} >
                {children}
            </Terminal>
        </div>
    )
}
