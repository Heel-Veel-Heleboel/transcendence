import { FormEvent, useState } from "react";
import { useChatService } from "../../components/providers/Chat";
import { IChatMessage } from "../../shared/types/chat";
import { extractApiError } from "../../shared/utils/error";

export function MessageForm({ channelId, onMessageAdded }: { channelId: string, onMessageAdded: (msg: IChatMessage) => void }) {
    const service = useChatService();
    const [content, setContent] = useState<string>('');

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            const message = await service.sendMessage({ channelId, content })
            setContent('');
            onMessageAdded(message);
        } catch (e: any) {
            alert(`Failed to send message: ${extractApiError(e)}`);
        }
    };

    return (
        <div id="message-form" className="min-h-1/5">
            <div className="min-h-full flex">
                <form className="min-h-full min-w-full flex" onSubmit={submit}>
                    <div className="min-w-4/5 min-h-full">
                        <input
                            type="text"
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
