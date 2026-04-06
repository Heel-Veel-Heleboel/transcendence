import { JSX, ReactNode } from "react";
import { Terminal } from "../../components/layout/Terminal";

export function LobbyRoom({ title, children }: { title: string, children: ReactNode }): JSX.Element {
    return (
        <div className="min-h-full flex flex-col border border-black">
            <Terminal title={title} >
                {children}
            </Terminal>
        </div>
    );
}
