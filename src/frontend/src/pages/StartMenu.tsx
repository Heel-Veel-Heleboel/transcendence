import { JSX } from "react"
import { useNavigate } from "react-router-dom"
import { CONFIG } from "../shared/config/AppConfig.ts"
import { Title } from "../features/entry/Title.tsx"
import { MenuOptionStart } from "../features/entry/MenuOption.tsx"
import { EntryContainer } from "../features/entry/LoginContainer.tsx"
import { CREDITS_NAVIGATION, ENTRY_NAVIGATION, QUIT_REDIRECT } from "../shared/constants/navigation.ts"

/* v8 ignore start */
export function StartMenu(): JSX.Element {
    const navigate = useNavigate();

    return (
        <EntryContainer>
            <div id='start-menu-container' className="h-screen relative z-1 text-white text-center flex flex-col justify-between">
                <div></div>
                <Title />
                { /* <Logo /> */}
                <div >
                    <MenuOptionStart text={CONFIG.MENU_OPTION_LOGIN_TEXT} margin={CONFIG.MENU_OPTION_MARGIN} callback={() => navigate(ENTRY_NAVIGATION)} />
                    <MenuOptionStart text={CONFIG.MENU_OPTION_CREDITS_TEXT} margin={CONFIG.MENU_OPTION_MARGIN} callback={() => navigate(CREDITS_NAVIGATION)} />
                    <MenuOptionStart text={CONFIG.MENU_OPTION_QUIT_TEXT} margin={CONFIG.MENU_OPTION_MARGIN} callback={() => window.location.replace(QUIT_REDIRECT)} />
                </div>
                <div></div>
            </div>
        </EntryContainer>
    )
}

/* v8 ignore stop */
