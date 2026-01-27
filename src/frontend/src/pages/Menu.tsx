import { JSX, useState } from "react"
import { Toolbar } from "../components/Toolbar.tsx";
import { MENU_PAGE } from '../constants/Constants.ts'
import { CONFIG } from '../constants/AppConfig.ts'
import { MainWindowContainer, Widget } from '../components/MenuUtils.tsx'
import { Profile } from '../components/Profile.tsx'
import { Settings } from '../components/Settings.tsx'
import { LiveChat } from '../components/LiveChat.tsx'
import { Gymkhana } from "../components/Gymkhana.tsx";
import { Speedmatching } from "../components/Speedmatching.tsx";
import { Mtvx } from "../components/Mtvx.tsx";
import { TrinityFetch } from "../components/TrinityFetch.tsx";

/* v8 ignore start */
export const Menu = (): JSX.Element => {
    const [page, setPage] = useState<number>(MENU_PAGE.MENU);

    function redirect(page: number) {
        setPage(page);
    }

    return (
        <div id='Menu' className="w-full h-full flex flex-col text-white">
            <Toolbar redirect={redirect} />
            {/*TODO: Change with p5 animation*/}
            <div id="backgroundImage" className="flex flex-col grow bg-[url(/bg.jpg)] bg-cover">
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
    const widgetWidth = "w-1/4"
    return (
        <div id="widgetContainer" className="min-h-1/2 min-w-full flex bg-sky-800/60 bg-clip-content">
            <Widget title={CONFIG.MATCHMAKING_TITLE} logoPath={CONFIG.MATCHMAKING_LOGO} width={widgetWidth} child={Speedmatching()} />
            <Widget title={CONFIG.TOURNAMENT_TITLE} logoPath={CONFIG.TOURNAMENT_LOGO} width={widgetWidth} child={Gymkhana()} />
            <Widget title={CONFIG.NEOFETCH_TITLE} logoPath={CONFIG.NEOFETCH_LOGO} width={widgetWidth} child={TrinityFetch()} />
            <Widget title={CONFIG.MUSICPLAYER_TITLE} logoPath={CONFIG.MUSICPLAYER_LOGO} width={widgetWidth} child={Mtvx()} />
        </div>
    )

}

/* v8 ignore stop */
