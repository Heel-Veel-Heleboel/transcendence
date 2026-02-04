import { JSX, useEffect, useLayoutEffect, useState } from "react"
import { Login } from '../components/Login.tsx'
import { Credits } from '../components/Credits.tsx'
import { CenterContainer, MainWindowContainer, Logo, MenuOption, Title, Animation } from "../components/StartMenuUtils.tsx"
import { START_MENU_PAGE } from '../constants/Constants.ts'
import "../style.css"
import { CONFIG } from "../constants/AppConfig.ts"
import { useAuth } from "../components/Auth.tsx"
import { useNavigate } from "react-router-dom"
import { getCookie } from "../utils/cookies.tsx"

/* v8 ignore start */
export function GetPage({ page, redirect }: { page: number, redirect: (page: number) => void }): JSX.Element {
    switch (page) {
        case START_MENU_PAGE.MENU:
            return <DefaultStartMenu redirect={redirect} />
        case START_MENU_PAGE.LOGIN:
            return <CenterContainer children={Login({ redirect })} />
        case START_MENU_PAGE.CREDITS:
            return <CenterContainer children={Credits({ redirect })} />
        default:
            return <DefaultStartMenu redirect={redirect} />
    }
}

export const StartMenu = (): JSX.Element => {
    const [page, setPage] = useState<number>(START_MENU_PAGE.MENU);
    const navigate = useNavigate();

    useEffect(() => {
        if (getCookie('refresh_token')) {
            console.log('found token');
            navigate('/menu');
        }
    }, [])
    function redirect(page: number) {
        setPage(page);
    }

    return (
        <div id='StartMenu' className="min-h-full grow">
            <Animation />
            <MainWindowContainer children={<GetPage page={page} redirect={redirect} />} />
        </div >
    )
}

export const DefaultStartMenu = ({ redirect }: { redirect: (page: number) => void }): JSX.Element => {
    return (
        <div id="StartMenuContent" className="h-screen relative z-1 text-white text-center flex flex-col justify-between">
            <div></div>
            <Title />
            <Logo />
            <div id="menuOptions">
                <MenuOption text={CONFIG.MENU_OPTION_LOGIN_TEXT} margin={CONFIG.MENU_OPTION_MARGIN} callback={() => redirect(START_MENU_PAGE.LOGIN)} />
                <MenuOption text={CONFIG.MENU_OPTION_CREDITS_TEXT} margin={CONFIG.MENU_OPTION_MARGIN} callback={() => redirect(START_MENU_PAGE.CREDITS)} />
                <MenuOption text={CONFIG.MENU_OPTION_QUIT_TEXT} margin={CONFIG.MENU_OPTION_MARGIN} callback={() => window.location.replace(CONFIG.QUIT_REDIRECT)} />
            </div>
            <div></div>
        </div>
    )
}

/* v8 ignore stop */
