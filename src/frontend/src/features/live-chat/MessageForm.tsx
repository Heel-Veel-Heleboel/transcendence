import { FormEvent, useState } from "react";
import { useChatService } from "../../components/providers/Chat";

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

