import { JSX, ReactNode } from "react"
import { TitleBar } from "./TitleBar"
import { htmlIdefier } from "../../shared/utils/html"
import { BorderHoverContainer } from "./BorderHoverContainer"

export function Widget({ logoPath, title, width, children }: { logoPath: string, title: string, width: string, children: ReactNode }): JSX.Element {
    return (
        <div id={`widget-${htmlIdefier(title)}`} className={`${width} flex flex-col min-h-full p-5 `} >
            <BorderHoverContainer title={title}>
                <TitleBar logoPath={logoPath} title={title} />

                {children}
            </BorderHoverContainer >
        </div>
    )
}
