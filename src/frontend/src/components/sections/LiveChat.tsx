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
