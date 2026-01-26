import { JSX } from "react"
import { GamesAvailable } from "./MenuUtils"

export function Gymkhana(): JSX.Element {
    const quickPlayContent = (): JSX.Element => {
        return (
            <div>content</div>
        )
    }
    const defaultContent = (): JSX.Element => {
        return (
            <div>content</div>
        )
    }
    const customizedContent = (): JSX.Element => {
        return (
            <div>content</div>
        )
    }
    return (
        <GamesAvailable quickPlayContent={quickPlayContent()} defaultContent={defaultContent()} customizedContent={customizedContent()} />
    )
}
