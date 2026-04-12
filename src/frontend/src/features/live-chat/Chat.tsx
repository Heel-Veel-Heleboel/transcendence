import { JSX, useEffect, useState } from "react"
import { IChatMessage } from "../../shared/types/chat.ts";
import { useChatService } from "../../components/providers/Chat.tsx";
import { ChatContainer } from "./ChatContainer.tsx";

// NOTE: GET /chat/channels/:channelId/messages to get all messages of selected channel
// if notification is sent for every message received then 
//      re-render chat when notification is received
//      or safe message in state.
// else
//      re-render chat with time interval
export function Chat({ currentChat }: { currentChat: string | null }): JSX.Element {
    const service = useChatService();
    const [chat, setChat] = useState<Array<IChatMessage>>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        async function getChat() {
            if (currentChat) {
                try {
                    setLoading(true)
                    setError(false)
                    const result = await service.getChannelMessages(currentChat);
                    setChat(result);
                } catch (e: any) {
                    console.error(e);
                    setError(e);
                } finally {
                    setLoading(false);
                }
            }
        }
        getChat();

    }, [currentChat])

    async function sendAck(messageId: string, response: boolean) {
        try {
            await service.setAck({ messageId, response });
        } catch (e: any) {
            console.error(e);
        }
    }

    function ListMessages({ chat }: { chat: Array<IChatMessage> }) {
        const listItems = chat.map(item =>
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


    if (!currentChat) {
        return (
            <ChatContainer>
                <div>select chat</div>
            </ChatContainer>
        )
    }

    if (loading) {
        return (
            <ChatContainer>
                <div>loading</div>
            </ChatContainer>
        )
    }

    if (error) {
        return (
            <ChatContainer>
                <div>error</div>
            </ChatContainer>
        )
    }

    return (
        <ChatContainer>
            <ListMessages chat={chat} />
        </ChatContainer>
    )
}

