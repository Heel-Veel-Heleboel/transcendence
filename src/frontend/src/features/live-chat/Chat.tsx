import { FormEvent, JSX, useEffect, useState } from "react"
import { IChatMessage } from "../../shared/types/chat.ts";
import { useChatService } from "../../components/providers/Chat.tsx";
import { ChatContainer } from "./ChatContainer.tsx";
import { RenderAckMessage, RenderMessage, RenderUnknownMessageType } from "./RenderMessage.tsx";
import { MessageForm } from "./MessageForm.tsx";

export function Chat({ channelId }: { channelId: string }): JSX.Element {
    const service = useChatService();
    const [chat, setChat] = useState<Array<IChatMessage>>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        async function getChat() {
            if (channelId) {
                try {
                    setLoading(true)
                    setError(false)
                    const result = await service.getChannelMessages(channelId);
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

    }, [channelId])


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
        return <ul>{listItems.reverse()}</ul>;
    }


    if (!channelId) {
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
        <div id="messenger-container" className="flex flex-col w-4/6 min-h-full">
            <ChatContainer>
                <ListMessages chat={chat} />
            </ChatContainer>
            <MessageForm channelId={channelId} />
        </div>
    )
}



