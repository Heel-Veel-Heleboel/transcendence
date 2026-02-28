import { JSX } from "react"
import { TitleBar, Terminal } from "../utils/MenuUtils"
import { CONFIG } from "../../constants/AppConfig"

/* v8 ignore start */
export function LiveChat(): JSX.Element {
    return (
        <div className="min-h-1/2 min-w-full flex flex-col bg-zinc-800/50 bg-clip-content">
            <TitleBar logoPath={CONFIG.LIVE_CHAT_LOGO} title={CONFIG.LIVE_CHAT_TITLE} />
            <div className="flex grow">
                <LiveChatRooms />
                <Chat />
                <LiveChatUsers />
            </div>
        </div>
    )
}

export function LiveChatRooms(): JSX.Element {
    const roomsContent = (): JSX.Element => {
        return (
            <div>Room content</div>
        )
    }
    return (
        <div className="w-1/6 border border-black">
            <Terminal title={CONFIG.LIVE_CHAT_ROOMS_TITLE} child={roomsContent()} />
        </div>
    )
}

export function Chat(): JSX.Element {
    const chatContent = (): JSX.Element => {
        return (
            <div>Chat content</div>
        )
    }
    return (
        <div className="w-4/6 border border-black">
            <Terminal title={CONFIG.LIVE_CHAT_CHAT_TITLE} child={chatContent()} />
        </div>
    )
}

export function LiveChatUsers(): JSX.Element {
    const userContent = (): JSX.Element => {
        return (
            <div>user content</div>
        )
    }
    return (
        <div className="w-1/6 border border-black">
            <Terminal title={CONFIG.LIVE_CHAT_USERS_TITLE} child={userContent()} />
        </div>
    )
}
/* v8 ignore stop */
