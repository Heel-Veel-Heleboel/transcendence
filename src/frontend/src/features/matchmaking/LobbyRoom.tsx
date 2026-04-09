import { JSX, ReactNode } from "react";
import { Terminal } from "../../components/layout/Terminal";
import { htmlIdefier } from "../../shared/utils/html";

export function LobbyRoom({ title, children }: { title: string, children: ReactNode }): JSX.Element {
    return (
        <div id={`lobbyroom-${htmlIdefier(title)}`} className="min-h-full flex flex-col border border-black">
            <Terminal title={title} >
                {children}
            </Terminal>
        </div>
    );
}
