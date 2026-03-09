import { JSX, useEffect } from "react"
import { CONFIG } from '../constants/AppConfig.ts'
import { Widget } from '../components/utils/MenuUtils.tsx'
import { LiveChat } from '../components/sections/LiveChat.tsx'
import { Matchmaking } from "../components/widgets/Matchmaking.tsx";
import { MusicPlayer } from "../components/widgets/MusicPlayer.tsx";
import { Neofetch } from "../components/widgets/Neofetch.tsx";
import { useAuth } from "../components/providers/Auth.tsx";
import { MainContainer } from "../components/sections/MainContainer.tsx";

/* v8 ignore start */
export const Menu = (): JSX.Element => {
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
            <Widget title={CONFIG.TOURNAMENT_TITLE} logoPath={CONFIG.TOURNAMENT_LOGO} width={'w-2/4'} child={Matchmaking()} />
            <Widget title={CONFIG.NEOFETCH_TITLE} logoPath={CONFIG.NEOFETCH_LOGO} width={'w-1/4'} child={Neofetch()} />
            <Widget title={CONFIG.MUSICPLAYER_TITLE} logoPath={CONFIG.MUSICPLAYER_LOGO} width={'w-1/4'} child={MusicPlayer()} />
        </div>
    )

}

/* v8 ignore stop */
