import { JSX, useLayoutEffect, useState } from "react"
import { useAuth } from "../components/providers/Auth.tsx"
import { useNavigate } from "react-router-dom"
import { SignIn } from "../features/login/SignIn.tsx"
import { Credits } from "../features/login/Credits.tsx"
import { START_MENU_PAGE } from "../shared/constants/Constants.ts"
import { CONFIG } from "../shared/config/AppConfig.ts"
import { Title } from "../features/login/Title.tsx"
import { Logo } from "../features/login/Logo.tsx"
import { MenuOption } from "../features/login/MenuOption.tsx"
import { Animation } from "../features/login/Animation.tsx"
import { CenterFlexContainer } from "../components/layout/CenteredFlexContainer.tsx"

/* v8 ignore start */
export function GetPage({ page, redirect }: { page: number, redirect: (page: number) => void }): JSX.Element {
    switch (page) {
        case START_MENU_PAGE.MENU:
            return <DefaultStartMenu redirect={redirect} />
        case START_MENU_PAGE.LOGIN:
            return <CenterFlexContainer >{SignIn({ redirect })} </CenterFlexContainer>
        case START_MENU_PAGE.CREDITS:
            return <CenterFlexContainer >{Credits({ redirect })} </CenterFlexContainer>
        default:
            return <DefaultStartMenu redirect={redirect} />
    }
}

export function Login(): JSX.Element {
    const [page, setPage] = useState<number>(START_MENU_PAGE.MENU);
    const navigate = useNavigate();
    const auth = useAuth();

    useLayoutEffect(() => {
        if (auth.token) {
            navigate(CONFIG.MENU_NAVIGATION);
        }
    }, [auth])
    function redirect(page: number) {
        setPage(page);
    }

    return (
        <div id='login-page' className="min-h-full grow">
            <Animation />
            <div className="h-screen">
                <GetPage page={page} redirect={redirect} />
            </div >
        </div >
    )
}

export const DefaultStartMenu = ({ redirect }: { redirect: (page: number) => void }): JSX.Element => {
    return (
        <div className="h-screen relative z-1 text-white text-center flex flex-col justify-between">
            <div></div>
            <Title />
            <Logo />
            <div >
                <MenuOption text={CONFIG.MENU_OPTION_LOGIN_TEXT} margin={CONFIG.MENU_OPTION_MARGIN} callback={() => redirect(START_MENU_PAGE.LOGIN)} />
                <MenuOption text={CONFIG.MENU_OPTION_CREDITS_TEXT} margin={CONFIG.MENU_OPTION_MARGIN} callback={() => redirect(START_MENU_PAGE.CREDITS)} />
                <MenuOption text={CONFIG.MENU_OPTION_QUIT_TEXT} margin={CONFIG.MENU_OPTION_MARGIN} callback={() => window.location.replace(CONFIG.QUIT_REDIRECT)} />
            </div>
            <div></div>
        </div>
    )
}

/* v8 ignore stop */
