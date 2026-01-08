import { JSX } from "react"
import "../../style.css"

export const Login = (): JSX.Element => {
    return (
        <div className="">
            <Animation />
            <div id="startMenu" className="relative z-1 text-white text-center">
                <Title />
                <Logo />
                <div id="menuOptions">
                    <MenuOption text="go to menu" />
                    <MenuOption text="go to game" />

                </div>
            </div>

        </div >
    )
}

export default function Animation(): JSX.Element {
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

export function MenuOption({ text }: { text: string }): JSX.Element {
    return (
        <button className="w-1/5 h-1/5 margin-10 border-10 border-solid border-[#5500FF] ml-auto mr-auto grid place-items-center text-center bg-[#A500FF] opacity-90">{text}</button >
    )
}

