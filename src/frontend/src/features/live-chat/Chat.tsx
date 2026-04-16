import { JSX, ReactNode, useEffect, useRef, useState } from "react"
import { IChatMessage } from "../../shared/types/chat.ts";
import { useChatService } from "../../components/providers/Chat.tsx";
import { ChatContainer } from "./ChatContainer.tsx";
import { RenderAckMessage, RenderMessage, RenderUnknownMessageType } from "./RenderMessage.tsx";
import { MessageForm } from "./MessageForm.tsx";

export function Chat({ channelId, messageUpdate }: { channelId: string, messageUpdate: number }): JSX.Element {
    const service = useChatService();
    const [chat, setChat] = useState<Array<IChatMessage>>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function getChat() {
            if (channelId) {
                try {
                    setLoading(true)
                    setError(false)
                    const result = await service.getChannelMessages(channelId);
                    setChat([...result].reverse());
                } catch (e: any) {
                    console.error(e);
                    setError(e);
                } finally {
                    setLoading(false);
                }
            }
        }
        getChat();

    }, [channelId, messageUpdate])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chat]);

    function handleMessageAdded(msg: IChatMessage) {
        setChat(prev => [...prev, msg]);
    }

    function ListMessages({ chat }: { chat: Array<IChatMessage> }) {
        const listItems = chat.map(item => {
            if (item.type === 'SYSTEM') {
                return (
                    <RenderAckMessage item={item} />
                )
            } else if (item.type === 'TEXT') {
                return (
                    <RenderMessage item={item} />
                )
            }
            return (
                <RenderUnknownMessageType item={item} />
            )
        });
        return <><ul>{listItems}</ul><div ref={bottomRef} /></>;
    }


    if (!channelId) {
        return (
            <MessengerContainer>
                <ChatContainer>
                    <div>select chat</div>
                </ChatContainer>
            </MessengerContainer>
        )
    }

    if (loading) {
        return (
            <MessengerContainer>
                <ChatContainer>
                    <div>loading</div>
                </ChatContainer>
            </MessengerContainer>
        )
    }

    if (error) {
        return (
            <MessengerContainer>
                <ChatContainer>
                    <div>error</div>
                </ChatContainer>
            </MessengerContainer>
        )
    }

    return (
        <MessengerContainer>
            <ChatContainer>
                <ListMessages chat={chat} />
            </ChatContainer>
            <MessageForm channelId={channelId} onMessageAdded={handleMessageAdded} />
        </MessengerContainer>
    )
}


export function MessengerContainer({ children }: { children: ReactNode }) {
    return (
        <div id="messenger-container" className="flex flex-col w-4/6 min-h-full">
            {children}
        </div>
    )
}
