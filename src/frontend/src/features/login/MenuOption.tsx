import { JSX } from "react";

export function MenuOption({ text, margin, callback }: { text: string, margin: number, callback: () => void }): JSX.Element {
    const divCss = `m-${margin} ml-auto mr-auto grid place-items-center text-center opacity-90`;
    return (
        <div className={divCss}>
            <button className="font-orbi text-center text-5xl text-zinc-600 hover:text-zinc-300 focus:text-zinc-300" onClick={callback}>{text}</button >
        </div>
    )
}
