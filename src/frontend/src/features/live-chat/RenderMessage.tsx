import { ReactNode } from "react";
import { IChatMessage } from "../../shared/types/chat";
import { useChatService } from "../../components/providers/Chat";

type AckStatus = 'pending' | 'acknowledged' | 'declined' | 'expired';

function parseAckStatus(metadata: string): AckStatus {
    try {
        const parsed = JSON.parse(metadata);
        if (parsed?.status) return parsed.status as AckStatus;
    } catch { }
    return 'pending';
}

const ACK_STATUS_LABELS: Record<Exclude<AckStatus, 'pending'>, { label: string; className: string }> = {
    acknowledged: { label: 'Accepted', className: 'bg-green-500 opacity-60 cursor-default' },
    declined:     { label: 'Rejected', className: 'bg-red-500 opacity-60 cursor-default' },
    expired:      { label: 'Expired',  className: 'border opacity-60 cursor-default' },
};

export function RenderAckMessage({ item }: { item: IChatMessage }) {
    const service = useChatService();
    const status = parseAckStatus(item.metadata);

    async function sendAck(messageId: string, response: boolean) {
        try {
            await service.setAck({ messageId, response });
        } catch (e: any) {
            alert('failed to send acknowledgement');
            console.error(e);
        }
    }

    const resolved = status !== 'pending' ? ACK_STATUS_LABELS[status] : null;

    return (
        <RenderMessageContainer id={item.id}>
            <RenderMessageDate item={item} />
            <RenderMessageContentContainer id={item.id}>
                <div className="flex flex-col">
                    <div>{item.content}</div>
                    <br />
                    <div className="flex justify-between">
                        <div></div>
                        <div className="flex justify-around w-1/4">
                            {resolved ? (
                                <button disabled className={resolved.className}>{resolved.label}</button>
                            ) : (
                                <>
                                    <button onClick={() => sendAck(item.id, true)} className="bg-green-500 hover:opacity-80">Accept</button>
                                    <div />
                                    <button onClick={() => sendAck(item.id, false)} className="bg-red-500 hover:opacity-80">Cancel</button>
                                </>
                            )}
                        </div>
                        <div></div>
                    </div>
                    <br />
                </div>
            </RenderMessageContentContainer>
        </RenderMessageContainer>
    )
}

export function RenderMessage({ item }: { item: IChatMessage }) {
    return (
        <RenderMessageContainer id={item.id}>
            <RenderMessageDate item={item} />
            <RenderMessageSender item={item} />
            <RenderMessageContent item={item} />
        </RenderMessageContainer>
    )

}

export function RenderUnknownMessageType({ item }: { item: IChatMessage }) {
    return (
        <RenderMessageContainer id={item.id} >
            <RenderMessageDate item={item} />
            <RenderMessageSender item={item} />
            <RenderMessageContentContainer id={item.id}>
                Unknown message type: not able to render message
            </RenderMessageContentContainer >
        </RenderMessageContainer>
    )

}

export function RenderMessageContainer({ id, children }: { id: string, children: ReactNode }) {
    return (

        <li key={id} id={`message-${id}`} className="flex w-full pt-px pb-px" >
            {children}
        </li >
    )

}

export function RenderMessageDate({ item }: { item: IChatMessage }) {
    const date = new Date(item.createdAt);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const formattedHours = hours < 10 ? '0' + hours.toString() : hours.toString();
    const formattedMinutes = minutes < 10 ? '0' + minutes.toString() : minutes.toString();
    const formattedSeconds = seconds < 10 ? '0' + seconds.toString() : seconds.toString();
    return (
        <div id={`message-date-${item.id}`} className="w-1/9">
            {'[' + formattedHours + ':' + formattedMinutes + ':' + formattedSeconds + ']'}
        </div>
    )
}

export function RenderMessageSender({ item }: { item: IChatMessage }) {
    return (
        <div id={`message-sender-${item.id}`} className="w-1/9 text-right pr-2">
            {item.senderUsername ?? item.senderId.toString()}
        </div>
    )
}

export function RenderMessageContent({ item }: { item: IChatMessage }) {
    return (
        <RenderMessageContentContainer id={item.id}>
            {item.content}
        </RenderMessageContentContainer>
    )
}

export function RenderMessageContentContainer({ id, children }: { id: string, children: ReactNode }) {
    return (
        <div id={`message-content-${id}`} className="w-7/9 border-l">
            <div className="pl-2 break-all text-wrap pr-2">
                {children}
            </div>
        </div >
    )
}

