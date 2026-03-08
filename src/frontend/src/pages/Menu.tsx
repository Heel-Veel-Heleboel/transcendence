import { JSX, useEffect, useState } from "react"
import { Toolbar } from "../components/sections/Toolbar.tsx";
import { MENU_PAGE } from '../constants/Constants.ts'
import { CONFIG } from '../constants/AppConfig.ts'
import { MainWindowContainer, Widget } from '../components/utils/MenuUtils.tsx'
import { Profile } from '../components/sections/Profile.tsx'
import { Settings } from '../components/sections/Settings.tsx'
import { LiveChat } from '../components/sections/LiveChat.tsx'
import { Matchmaking } from "../components/widgets/Matchmaking.tsx";
import { MusicPlayer } from "../components/widgets/MusicPlayer.tsx";
import { Neofetch } from "../components/widgets/Neofetch.tsx";
import { useAuth } from "../components/providers/Auth.tsx";

/* v8 ignore start */
export const Menu = (): JSX.Element => {
    const [page, setPage] = useState<number>(MENU_PAGE.MENU);
    const auth = useAuth();

    useEffect(() => {
        if (auth.token === null) {
            auth.gotoLogin();
        }
    }, [])

    function redirect(page: number) {
        setPage(page);
    }

    return (
        <div className="w-full h-full flex flex-col text-white">
            <Toolbar redirect={redirect} />
            {/*TODO: Change with p5 animation*/}
            <div className="flex flex-col h-19/20 bg-[url(/bg.jpg)] bg-cover">
                <MainWindowContainer children={<GetPage page={page} />} />
            </div>
        </div>
    )
}

export function GetPage({ page }: { page: number }): JSX.Element {
    switch (page) {
        case MENU_PAGE.MENU:
            return <DefaultMenu />
        case MENU_PAGE.PROFILE:
            return <Widget logoPath={CONFIG.PROFILE_LOGO} title={CONFIG.PROFILE_TITLE} width="w-full" child={<Profile />} />
        case MENU_PAGE.SETTINGS:
            return <Widget logoPath={CONFIG.SETTINGS_LOGO} title={CONFIG.SETTINGS_TITLE} width="w-full" child={<Settings />} />
        default:
            return <DefaultMenu />
    }
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
