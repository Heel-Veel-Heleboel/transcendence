import { JSX, useState } from "react"
import { Toolbar } from "../components/Toolbar.tsx";
import { MENU_PAGE } from '../constants/Constants.ts'
import { MainWindowContainer, Widget } from '../components/MenuUtils.tsx'
import { Profile } from '../components/Profile.tsx'
import { Settings } from '../components/Settings.tsx'
import { LiveChat } from '../components/LiveChat.tsx'
import { Gymkhana } from "../components/Gymkhana.tsx";
import { Speedmatching } from "../components/Speedmatching.tsx";
import { Mtvx } from "../components/Mtvx.tsx";
import { TrinityFetch } from "../components/TrinityFetch.tsx";

// NOTE: stay here

export const Menu = (): JSX.Element => {
    const [page, setPage] = useState<number>(MENU_PAGE.MENU);

    function redirect(page: number) {
        setPage(page);
    }

    return (
        <div id='Menu' className="w-full h-full flex flex-col text-white">
            <Toolbar redirect={redirect} />
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
            return <Widget logoPath="profile.png" title="profile" width="w-full" child={<Profile />} />
        case MENU_PAGE.SETTINGS:
            return <Widget logoPath="settings.png" title="settings" width="w-full" child={<Settings />} />
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

            {/*
                <a href="https://www.flaticon.com/free-icons/matchmaker" title="matchmaker icons">Matchmaker icons created by Smashicons - Flaticon</a>
                <a href="https://www.flaticon.com/free-icons/structure" title="structure icons">Structure icons created by Irakun - Flaticon</a>
                <a href="https://www.flaticon.com/free-icons/crocodile" title="crocodile icons">Crocodile icons created by Freepik - Flaticon</a>
                <a href="https://www.flaticon.com/free-icons/vinyl" title="vinyl icons">Vinyl icons created by Roundicons - Flaticon</a>
            */}

            <Widget title="speedmatching" logoPath="matchmaker.png" width={widgetWidth} child={Speedmatching()} />
            <Widget title="gymkhana" logoPath="gymkhana.png" width={widgetWidth} child={Gymkhana()} />
            <Widget title="trinityfetch" logoPath="crocodile.png" width={widgetWidth} child={TrinityFetch()} />
            <Widget title="mtvx" logoPath='vinyl.png' width={widgetWidth} child={Mtvx()} />


        </div>
    )

}

