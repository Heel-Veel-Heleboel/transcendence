import { JSX, useState } from "react"
import { CONFIG } from "../../shared/config/AppConfig.ts";
import { TitleBar } from "../../components/layout/TitleBar.tsx";
import { LiveChatRooms } from "./LiveChatRooms.tsx";
import { LiveChatUsers } from "./LiveChatUsers.tsx";
import { Chat } from "./Chat.tsx";

/* v8 ignore start */
export function LiveChat(): JSX.Element {
    const [chat, setChat] = useState<string | null>(null);

    return (
        <div className="min-h-1/2 min-w-full flex flex-col bg-zinc-800/50 bg-clip-content">
            <TitleBar logoPath={CONFIG.LIVE_CHAT_LOGO} title={CONFIG.LIVE_CHAT_TITLE} />
            <div className="flex h-19/20">
                <LiveChatRooms setChat={setChat} />
                <Chat currentChat={chat} />
                <LiveChatUsers />
            </div>
        </div>
    )
}


/* v8 ignore stop */
