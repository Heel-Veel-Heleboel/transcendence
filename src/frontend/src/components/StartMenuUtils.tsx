import { JSX } from "react"
import { CONFIG } from '../constants/AppConfig.ts'

/* v8 ignore start*/
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
            {/*TODO: Change with p5 animation*/}
            <source src="/bg.mp4" type="video/mp4" />
        </video>
    )
}

export function Title(): JSX.Element { return (<h1 className="text-8xl font-monof text-metalgear">Counter-pong</h1>) }

export function Logo(): JSX.Element {
    return (
        <div className="flex justify-center ml-auto mr-auto opacity-95 contrast-200">
            <img src={CONFIG.LOGIN_PAGE_LOGO} alt={CONFIG.LOGIN_PAGE_ALT} />
        </div>
    )
}

export function MenuOption({ text, margin, callback }: { text: string, margin: number, callback: () => void }): JSX.Element {
    const divCss = `m-${margin} ml-auto mr-auto grid place-items-center text-center opacity-90`;
    return (
        <div className={divCss}>
            <button className="font-orbi text-center text-5xl text-zinc-600 hover:text-zinc-300 focus:text-zinc-300" onClick={callback}>{text}</button >
        </div>
    )
}
/* v8 ignore stop*/
