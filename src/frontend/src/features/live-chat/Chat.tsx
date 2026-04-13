import { FormEvent, JSX, useEffect, useState } from "react"
import { IChatMessage } from "../../shared/types/chat.ts";
import { useChatService } from "../../components/providers/Chat.tsx";
import { ChatContainer } from "./ChatContainer.tsx";

// NOTE: GET /chat/channels/:channelId/messages to get all messages of selected channel
// if notification is sent for every message received then 
//      re-render chat when notification is received
//      or safe message in state.
// else
//      re-render chat with time interval
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
                    console.log(result);
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
                <RenderUnknownMessageType />
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


export function RenderMessage({ item }: { item: IChatMessage }) {
    console.log('item');
    console.log(item);
    return (
        <li key={item.id} id={`message-${item.id}`} className="flex w-full pt-px pb-px" >
            <RenderMessageDate item={item} />
            <RenderMessageSender item={item} />
            <RenderMessageContent item={item} />
        </li >
    )

}

export function RenderUnknownMessageType() {
    return (
        <div></div>
    )

}

export function RenderMessageDate({ item }: { item: IChatMessage }) {
    const date = new Date(item.createdAt);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const formattedSeconds = seconds < 10 ? '0' + seconds.toString() : seconds.toString();
    return (
        <div id={`message-date-${item.id}`} className="w-1/9">
            {'[' + hours + ':' + minutes + ':' + formattedSeconds + ']'}
        </div>
    )
}

export function RenderMessageSender({ item }: { item: IChatMessage }) {
    return (
        <div id={`message-sender-${item.id}`} className="w-1/9 text-right pr-2">
            {item.senderId.toString()}
        </div>
    )
}

export function RenderMessageContent({ item }: { item: IChatMessage }) {
    return (
        <div id={`message-content-${item.id}`} className="w-7/9 border-l">
            <div className="pl-2 break-all text-wrap pr-2">
                {item.content}
            </div>
        </div >
    )
}


export function RenderAckMessage({ item }: { item: IChatMessage }) {
    const service = useChatService();

    async function sendAck(messageId: string, response: boolean) {
        try {
            await service.setAck({ messageId, response });
        } catch (e: any) {
            alert('failed to send acknowledgement');
            console.error(e);
        }
    }
    return (
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
    )
}

export function MessageForm({ channelId }: { channelId: string }) {
    const service = useChatService();
    const [content, setContent] = useState<string>('');

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            await service.sendMessage({ channelId, content })
            setContent('');
        } catch (e: any) {
            alert('failed to send message');
            console.error(e);
        }
    };

    return (
        <div id="message-form" className="min-h-1/5">
            <div className="min-h-full flex">
                <form className="min-h-full min-w-full flex" onSubmit={submit}>
                    <div className="min-w-4/5 min-h-full">
                        <textarea
                            id="message-input-element"
                            name="message-input"
                            className="border w-full min-h-full"
                            value={content}
                            onChange={e => setContent(e.target.value)}
                        />
                    </div>
                    <div id="message-send-button" className="min-w-1/5 min-h-full">
                        <button type="submit" className="border min-h-full w-full" >Send</button>
                    </div>
                </form>
            </div>
        </div >
    )
}

