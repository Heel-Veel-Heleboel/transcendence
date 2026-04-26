import { JSX, ReactNode } from "react"
import { TitleBar } from "./TitleBar"

export function Widget({ logoPath, title, width, children }: { logoPath: string, title: string, width: string, children: ReactNode }): JSX.Element {
    return (
        <div id={`widget-${title}`} className={`${width} flex flex-col min-h-full p-5`} >
            <TitleBar logoPath={logoPath} title={title} />

            {children}
        </div>
    )
}
