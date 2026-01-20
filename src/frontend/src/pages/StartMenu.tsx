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
            return <CenterContainer children={Credits({ redirect })} />
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
        <div id='StartMenu' className="min-h-full grow">
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

export function Credits({ redirect }: { redirect: (page: number) => void }): JSX.Element {
    return (
        <div className="flex flex-col justify-between min-h-full text-white">
            <div />
            <CreditsSectionMembers />
            <CreditsSectionServices />
            <MenuOption text="MENU" callback={() => redirect(PAGE.MENU)} />
            <div />
        </div>
    )
}

export function CreditsSectionMembers(): JSX.Element {
    return (
        <div>
            <CreditsSectionTitle title="Members" />
            <CreditsSectionContent Key="" value="vshkonda" />
            <CreditsSectionContent Key="" value="spenning" />
            <CreditsSectionContent Key="" value="amysiv" />
        </div>
    )

}

export function CreditsSectionServices(): JSX.Element {
    return (
        <div>
            <CreditsSectionTitle title="services" />
            <CreditsSectionContent Key="api-gateway" value="vshkonda" />
            <CreditsSectionContent Key="frontend" value="spenning" />
            <CreditsSectionContent Key="user-management" value="amysiv" />
            <CreditsSectionContent Key="auth" value="amysiv" />
            <CreditsSectionContent Key="game-server" value="spenning" />
            <CreditsSectionContent Key="observability" value="vshkonda" />
            <CreditsSectionContent Key="matchmaking" value="vshkonda" />
            <CreditsSectionContent Key="livechat" value="vshkonda" />
        </div>
    )

}

export function CreditsSectionContent({ Key, value }: { Key: string, value: string }) {
    const split =
        <div>
            <div className="flex justify-between text-2xl">
                <div className="font-orbi text-right w-3xs">{Key}</div>
                <div className="w-5"></div>
                <div className="font-orbi text-left w-3xs">{value}</div>
            </div>
        </div>;
    const center =
        <div>
            <div className="flex justify-between text-2xl">
                <div ></div>
                <div className="font-orbi text-center w-3xs">{value}</div>
                <div ></div>
            </div>
        </div>;

    if (Key.length === 0)
        return (center);

    return (split);

}

export function CreditsSectionTitle({ title }: { title: string }) {
    return (
        <div className="font-orbi text-6xl text-center">{title}</div>
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
        <div className="h-screen">
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

