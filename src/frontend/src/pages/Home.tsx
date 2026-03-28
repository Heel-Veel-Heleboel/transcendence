import { JSX, useEffect } from "react"
import { useAuth } from "../components/providers/Auth.tsx";
import { CONFIG } from "../shared/config/AppConfig.ts";
import { LiveChat } from "../features/live-chat/LiveChat.tsx";
import { Matchmaking } from "../features/matchmaking/Matchmaking.tsx";
import { Neofetch } from "../features/neofetch/Neofetch.tsx";
import { MainContainer } from "../components/layout/MainContainer.tsx";
import { Widget } from "../components/layout/Widget.tsx";

/* v8 ignore start */
export function Home(): JSX.Element {
    const auth = useAuth();

    useEffect(() => {
        if (auth.token === null) {
            auth.gotoLogin();
        }
    }, [])

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
        <div className="min-h-1/2 min-w-full flex bg-sky-800/60 bg-clip-content">
            <Widget title={CONFIG.TOURNAMENT_TITLE} logoPath={CONFIG.TOURNAMENT_LOGO} width={'w-2/4'} >
                <Matchmaking />
            </Widget>
            <Widget title={CONFIG.NEOFETCH_TITLE} logoPath={CONFIG.NEOFETCH_LOGO} width={'w-1/4'} >
                <Neofetch />
            </Widget>
            <Widget title={CONFIG.MUSICPLAYER_TITLE} logoPath={CONFIG.MUSICPLAYER_LOGO} width={'w-1/4'} >
                <Neofetch />
            </Widget>
        </div >
    )

}

/* v8 ignore stop */
