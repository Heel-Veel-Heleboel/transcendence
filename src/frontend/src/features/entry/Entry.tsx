import { JSX } from "react";
import { useNavigate } from "react-router-dom";
import { REGISTER_NAVIGATION, LOGIN_NAVIGATION, START_MENU_NAVIGATION } from "../../shared/constants/navigation";
import { MenuOption } from "./MenuOption";

export function EntryMenu(): JSX.Element {
    const navigate = useNavigate();

    return (
        <div id='entry-menu' className="min-h-full text-white text-center flex flex-col justify-around bg-zinc-400/60 border font-orbi">
            <div className="text-3xl">
                <button onClick={() => navigate(LOGIN_NAVIGATION)} className="border w-3xs">LOG IN</button>
                <br />
                <br />
                <button onClick={() => navigate(REGISTER_NAVIGATION)} className="border w-3xs">REGISTER</button>
            </div>
            <MenuOption text={'BACK TO MENU'} margin={0} callback={() => navigate(START_MENU_NAVIGATION)} />
        </div>
    )
}
