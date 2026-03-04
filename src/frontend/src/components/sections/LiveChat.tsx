import { JSX, useEffect, useState } from "react"
import { TitleBar, Terminal } from "../utils/MenuUtils"
import { CONFIG } from "../../constants/AppConfig"
import { connectNotifications } from "../utils/NotificationConnect"
import api from "../../api";

/* v8 ignore start */
export function LiveChat(): JSX.Element {
    const notif = connectNotifications();

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
        // NOTE: GET /chat/channels to get all channels and render them
        // re-render when [new channel created(dm/group), notification is send for match-ack]
        // when user clicks on channel, chat content is rendered in chat Component,
        // and under the channel that is rendered, the names of members of channel will be shown with an indentation
        // also shows current status of user behind username
        // e.g.
        // groupChannel1
        //     user1 x
        //     user2 o
        // user1 x
        // user2 o
        // also option to delete chat or leave groupchat if implemented in chat-service
        // 
        //
        const [chats, setChats] = useState<Array<string>>([]);
        const [error, setError] = useState<Error | null>(null);

        useEffect(() => {
            async function getChannels() {
                try {
                    const result = await api({
                        url: CONFIG.REQUEST_CHANNEL_ALL,
                        method: CONFIG.REQUEST_CHANNEL_ALL_METHOD,
                    })
                    setChats([...chats, result.data[0].id]);
                    console.log(result);
                } catch (e: any) {
                    console.error(e);
                    setError(e);
                }
            }

            getChannels();

        }, []);
        function List(list: Array<string>) {
            const listItems = list.map(item =>
                <li>{item}</li>
            );
            return <ul>{listItems}</ul>;
        }

        return (
            <div>
                {error ? 'could not load channels' : List(chats)}
            </div>
        )
    }
    return (
        <div className="w-1/6 border border-black">
            <Terminal title={CONFIG.LIVE_CHAT_ROOMS_TITLE} child={roomsContent()} />
        </div>
    )
}

export function Chat(): JSX.Element {
    // NOTE: GET /chat/channels/:channelId/messages to get all messages of selected channel
    // if notification is sent for every message received then 
    //      re-render chat when notification is received
    //      or safe message in state.
    // else
    //      re-render chat with time interval
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
    // NOTE: Searchbar with empty content at first render
    // USERS search username and it displays search result
    // USER can click on dropdown menu which shows following options
    //      + show profile
    //      + friend
    //      + message
    //      + groupchat
    //      + block
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
