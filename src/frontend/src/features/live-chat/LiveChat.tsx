import { JSX, useEffect, useState } from "react"
import { CONFIG } from "../../shared/config/AppConfig.ts";
import { TitleBar } from "../../components/layout/TitleBar.tsx";
import { LiveChatRooms } from "./LiveChatRooms.tsx";
import { LiveChatUsers } from "./LiveChatUsers.tsx";
import { Chat } from "./Chat.tsx";
import { useNotifications } from "../../components/hooks/Notifications.tsx";

/* v8 ignore start */
export function LiveChat(): JSX.Element {
    const [channelId, setChannelId] = useState<string>('');
    const [localChatUpdate, setLocalChatUpdate] = useState<number>(0);
    const [hasPendingInvite, setHasPendingInvite] = useState<boolean>(false);
    const notif = useNotifications();

    useEffect(() => {
        setHasPendingInvite(false);
    }, [notif.matchUpdate]);

    function openNewChannel(id: string) {
        setChannelId(id);
        setLocalChatUpdate(n => n + 1);
    }

    return (
        <div id='live-chat' className="min-h-1/2 min-w-full flex flex-col bg-zinc-800/50 bg-clip-content p-5">
            <TitleBar logoPath={CONFIG.LIVE_CHAT_LOGO} title={CONFIG.LIVE_CHAT_TITLE} />
            <div id='live-chat-containers' className="flex h-14/15">
                <LiveChatRooms setChannelId={setChannelId} chatUpdate={notif.chatUpdate + localChatUpdate} openChannelId={channelId} lastMessageChannelId={notif.lastMessageChannelId} />
                <Chat channelId={channelId} messageUpdate={notif.messageUpdate} />
                <LiveChatUsers setChannelId={openNewChannel} hasPendingInvite={hasPendingInvite} setHasPendingInvite={setHasPendingInvite} />
            </div>
        </div>
    )
}


/* v8 ignore stop */
