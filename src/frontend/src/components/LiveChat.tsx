import { JSX } from "react"
import { TitleBar, Terminal } from "./MenuUtils"

export function LiveChat(): JSX.Element {
    return (
        <div id="liveChat" className="min-h-1/2 min-w-full flex flex-col bg-zinc-800/50 bg-clip-content">
            {/*
                <a href="https://www.flaticon.com/free-icons/hive" title="hive icons">Hive icons created by gravisio - Flaticon</a>
            */}
            <TitleBar logoPath="beehive.png" title='UrlChat' />
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
            <Terminal title="Rooms" child={roomsContent()} />
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
            <Terminal title="Chat" child={chatContent()} />
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
            <Terminal title="Users" child={userContent()} />
        </div>
    )
}
