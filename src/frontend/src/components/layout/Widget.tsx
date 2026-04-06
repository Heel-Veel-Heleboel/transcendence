import { JSX, ReactNode } from "react"
import { TitleBar } from "./TitleBar"

export function Widget({ logoPath, title, width, children }: { logoPath: string, title: string, width: string, children: ReactNode }): JSX.Element {
    const outerContainerCss = `${width} flex flex-col min-h-full`
    return (
        <div className={outerContainerCss} id={`widget-${title}`}>
            <TitleBar logoPath={logoPath} title={title} />

            {children}
        </div>
    )
}
