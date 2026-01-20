import { JSX, useState } from "react"
import "../style.css"

const PAGE = Object.freeze({
    MENU: 0,
    LOGIN: 1,
    CREDITS: 2
})

export function GetPage({ page, redirect }: { page: number, redirect: (page: number) => void }): JSX.Element {
    switch (page) {
        case PAGE.MENU:
            return <DefaultStartMenu redirect={redirect} />
        case PAGE.LOGIN:
            return <CenterContainer children={Login()} />
        case PAGE.CREDITS:
            return <CenterContainer children={Credits()} />
        default:
            return <DefaultStartMenu redirect={redirect} />
    }
}

export const StartMenu = (): JSX.Element => {
    const [page, setPage] = useState<number>(PAGE.MENU);

    function redirect(page: number) {
        setPage(page);
    }

    return (
        <div id='StartMenu' className="min-h-full">
            <Animation />
            <MainWindowContainer children={<GetPage page={page} redirect={redirect} />} />
        </div >
    )
}

export const DefaultStartMenu = ({ redirect }: { redirect: (page: number) => void }): JSX.Element => {
    return (
        <div id="StartMenuContent" className="relative z-1 text-white text-center">
            <Title />
            <Logo />
            <div id="menuOptions">
                <MenuOption text="LOGIN" callback={() => redirect(PAGE.LOGIN)} />
                <MenuOption text="CREDITS" callback={() => redirect(PAGE.CREDITS)} />
                <MenuOption text="QUIT" callback={() => window.location.replace("https://www.youtube.com/watch?v=dQw4w9WgXcQ")} />
            </div>
        </div>
    )
}

export function Login(): JSX.Element {
    return (
        <div className="text-white min-h-full">login</div>
    )
}

export function Credits(): JSX.Element {
    return (
        <div className="text-white">credits</div>
    )
}

export function CenterContainer({ children }: { children: JSX.Element }): JSX.Element {
    return (
        <div className="flex justify-between min-h-full grow">
            <div />
            {children}
            <div />
        </div>
    )
}

export function MainWindowContainer({ children }: { children: JSX.Element }): JSX.Element {
    return (
        <div className="min-h-full">
            {children}
        </div>
    )
}

export function Animation(): JSX.Element {
    return (
        <video autoPlay muted loop className="fixed right-0 bottom-0 min-w-full min-h-full -z-1 object-cover" id="bgVideo">
            <source src="/bg.mp4" type="video/mp4" />
        </video>
    )
}

export function Title(): JSX.Element { return (<h1 className="text-8xl font-mono text-metalgear">Counter-pong</h1>) }

export function Logo(): JSX.Element {
    return (
        <div className="flex justify-center ml-auto mr-auto opacity-95 contrast-200">
            <img src="/logo.png" alt="Login Page Logo" />
        </div>
    )
}

export function MenuOption({ text, callback }: { text: string, callback: () => void }): JSX.Element {
    return (
        <div className="w-1/5 h-1/5 m-10 ml-auto mr-auto grid place-items-center text-center opacity-90" >
            <button className="font-orbi text-center text-5xl text-zinc-600 hover:text-zinc-300 focus:text-zinc-300" onClick={callback}>{text}</button >
        </div>
    )
}

