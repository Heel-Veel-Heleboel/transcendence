import { Dispatch, JSX, SetStateAction, useEffect, useState } from "react"
import { TitleBar, Terminal } from "../utils/MenuUtils"
import { CONFIG } from "../../constants/AppConfig"
import api from "../../api";
import { useNotifications } from "../hooks/Notifications.tsx";
import { IChat } from "../../types/types.ts";

/* v8 ignore start */
export function LiveChat(): JSX.Element {
    const notif = useNotifications();
    const [channels, setChannels] = useState<Array<string>>([]);
    const [chat, setChat] = useState<string | null>(null);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function getChannels() {
            try {
                const result = await api({
                    url: CONFIG.REQUEST_CHANNEL_ALL,
                    method: CONFIG.REQUEST_CHANNEL_ALL_METHOD,
                })

                console.log(result);
                const mappedChannels = result.data.map(channel => channel.id);
                setChannels(mappedChannels);
            } catch (e: any) {
                console.error(e);
                setError(e);
            }
        }
        getChannels();
    }, [notif.chatUpdate]);

    return (
        <div className="min-h-1/2 min-w-full flex flex-col bg-zinc-800/50 bg-clip-content">
            <TitleBar logoPath={CONFIG.LIVE_CHAT_LOGO} title={CONFIG.LIVE_CHAT_TITLE} />
            <div className="flex h-19/20">
                <LiveChatRooms error={error} channels={channels} setChat={setChat} />
                <Chat currentChat={chat} />
                <LiveChatUsers />
            </div>
        </div>
    )
}

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
export function LiveChatRooms({ error, channels, setChat }: { error: Error | null, channels: Array<string>, setChat: Dispatch<SetStateAction<string | null>> }): JSX.Element {
    const roomsContent = (): JSX.Element => {
        function List(list: Array<string>) {
            const listItems = list.map(item =>
                <li onClick={() => { setChat(item) }} key={item}>{item}</li>
            );
            return <ul>{listItems}</ul>;
        }

        return (
            <div>
                {error ? 'could not load channels' : List(channels)}
            </div>
        )
    }
    return (
        <div className="w-1/6 border border-black">
            <Terminal title={CONFIG.LIVE_CHAT_ROOMS_TITLE} child={roomsContent()} />
        </div>
    )
}

// NOTE: GET /chat/channels/:channelId/messages to get all messages of selected channel
// if notification is sent for every message received then 
//      re-render chat when notification is received
//      or safe message in state.
// else
//      re-render chat with time interval
export function Chat({ currentChat }: { currentChat: string | null }): JSX.Element {
    const [chat, setChat] = useState<Array<IChat>>([]);
    const [error, setError] = useState<Error | null>(null);
    useEffect(() => {
        async function getChat() {
            if (currentChat) {
                try {
                    const result = await api({
                        url: CONFIG.REQUEST_CHAT(currentChat),
                        method: CONFIG.REQUEST_CHAT_METHOD
                    })
                    setChat(result.data);
                    console.log(result);
                } catch (e: any) {
                    console.error(e);
                    setError(e);
                }
            }
        }
        getChat();

    }, [currentChat])

    async function sendAck(messageId: string, response: boolean) {
        try {
            await api({
                url: CONFIG.REQUEST_MATCH_ACK(messageId),
                method: CONFIG.REQUEST_MATCH_METHOD,
                // headers: CONFIG.REQUEST_MATCH_HEADERS,
                data: { "acknowledge": response },
            })
        } catch (e: any) {
            console.error(e);
        }
    }

    function List(list: Array<IChat>) {
        const listItems = list.map(item =>
            <li key={item.id}>
                <br />
                <div className="border border-white flex justify-between">
                    <div></div>
                    <div className="flex flex-col">
                        <div>
                            {item.content}
                        </div>
                        <br />
                        <div className="flex justify-between">
                            <div></div>
                            <div className="flex justify-around w-1/4">
                                <button onClick={() => sendAck(item.id, true)} className="bg-green-500">Accept</button>
                                <div />
                                <button onClick={() => sendAck(item.id, false)} className="bg-red-500">Cancel</button>
                            </div>

                            <div></div>
                        </div>
                        <br />
                    </div>
                    <div></div>
                </div>
            </li>
        );
        return <ul>{listItems}</ul>;
    }

    const chatContent = (): JSX.Element => {
        return (
            <div id="ChatContent" >
                {
                    error ? 'failed to retrieve chat' : currentChat ? List(chat) : 'select chat'
                }
            </div>
        )
    }
    return (
        <div className="w-4/6 min-h-full border border-black">
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
