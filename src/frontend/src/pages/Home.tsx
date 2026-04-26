import { JSX } from "react"
import { CONFIG } from "../shared/config/AppConfig.ts";
import { LiveChat } from "../features/live-chat/LiveChat.tsx";
import { Matchmaking } from "../features/matchmaking/Matchmaking.tsx";
import { Neofetch } from "../features/neofetch/Neofetch.tsx";
import { MainContainer } from "../components/layout/MainContainer.tsx";
import { Widget } from "../components/layout/Widget.tsx";

/* v8 ignore start */
export function Home(): JSX.Element {
    return (
        <MainContainer children={<DefaultMenu />} />
    )
}

export function DefaultMenu(): JSX.Element {
    return (
        <>
            <Widgets />
            <LiveChat />
        </>
    )
}


export function Widgets(): JSX.Element {
    return (
        <div id='widgets-container' className="min-h-1/2 min-w-full flex bg-sky-800/60 bg-clip-content">
            <Widget title={CONFIG.TOURNAMENT_TITLE} logoPath={CONFIG.TOURNAMENT_LOGO} width={'w-2/4'} >
                <Matchmaking />
            </Widget>
            <Widget title={CONFIG.NEOFETCH_TITLE} logoPath={CONFIG.NEOFETCH_LOGO} width={'w-2/4'} >
                <Neofetch />
            </Widget>
        </div >
    )

}

/* v8 ignore stop */
