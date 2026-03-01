import { JSX } from "react"
import { LobbyRoom } from "../utils/MenuUtils"


/* v8 ignore start*/
export function Speedmatching(): JSX.Element {
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
        <LobbyRoom gamesContent={quickPlayContent()} />
    )
}
/* v8 ignore stop*/
