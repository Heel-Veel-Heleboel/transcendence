import { JSX, useLayoutEffect } from "react"
import { useAuth } from "../components/providers/Auth.tsx"
import { useNavigate } from "react-router-dom"
import { CONFIG } from "../shared/config/AppConfig.ts"
import { Title } from "../features/login/Title.tsx"
import { Logo } from "../features/login/Logo.tsx"
import { MenuOption } from "../features/login/MenuOption.tsx"
import { LoginContainer } from "../features/login/LoginContainer.tsx"
import { CREDITS_NAVIGATION, HOME_NAVIGATION, LOGIN_NAVIGATION, QUIT_REDIRECT } from "../shared/constants/navigation.ts"

/* v8 ignore start */
export function StartMenu(): JSX.Element {
    const navigate = useNavigate();
    const auth = useAuth();

    useLayoutEffect(() => {
        if (auth.token) {
            navigate(HOME_NAVIGATION);
        }
    }, [auth])
    return (
        <LoginContainer>
            <div className="h-screen relative z-1 text-white text-center flex flex-col justify-between">
                <div></div>
                <Title />
                <Logo />
                <div >
                    <MenuOption text={CONFIG.MENU_OPTION_LOGIN_TEXT} margin={CONFIG.MENU_OPTION_MARGIN} callback={() => navigate(LOGIN_NAVIGATION)} />
                    <MenuOption text={CONFIG.MENU_OPTION_CREDITS_TEXT} margin={CONFIG.MENU_OPTION_MARGIN} callback={() => navigate(CREDITS_NAVIGATION)} />
                    <MenuOption text={CONFIG.MENU_OPTION_QUIT_TEXT} margin={CONFIG.MENU_OPTION_MARGIN} callback={() => window.location.replace(QUIT_REDIRECT)} />
                </div>
                <div></div>
            </div>
        </LoginContainer>
    )
}

/* v8 ignore stop */
