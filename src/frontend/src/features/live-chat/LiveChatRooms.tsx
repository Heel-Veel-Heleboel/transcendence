import { Dispatch, JSX, useState, SetStateAction, useEffect } from "react";
import { useChatService } from "../../components/providers/Chat";
import { useAuth } from "../../components/providers/Auth";
import { LiveChatRoomsContainer } from "./LiveChatRoomsContainer";
import { IChat } from "../../shared/types/chat";

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
export function LiveChatRooms({ setChannelId, chatUpdate }: { setChannelId: Dispatch<SetStateAction<string>>, chatUpdate: number }): JSX.Element {

    const service = useChatService();
    const auth = useAuth();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [channels, setChannels] = useState<Array<IChat>>([]);

    useEffect(() => {
        async function getChannels() {
            try {
                setLoading(true);
                setError(false);
                const result = await service.getChannels();
                setChannels(result);
            } catch (e: any) {
                console.error(e);
                setError(e);
            } finally {
                setLoading(false);
            }
        }
        getChannels();
    }, [chatUpdate]);

    function channelDisplayName(channel: IChat): string {
        if (channel.type === 'DM') {
            const other = channel.members.find(m => m.userId !== Number(auth.userId));
            return other?.username ?? 'DM';
        }
        return channel.name ?? 'Group Chat';
    }

    function List({ channels }: { channels: Array<IChat> }) {
        // TODO: make seperate unread counter component
        const listItems = channels.map(item =>
            <li onClick={() => { setChannelId(item.id) }} key={item.id}>{channelDisplayName(item)} {item.unreadCount ? `unread:${item.unreadCount}` : null}</li>
        );
        return <ul>{listItems}</ul>;
    }

    if (loading) {
        return (
            <LiveChatRoomsContainer>
                <div>loading</div>
            </LiveChatRoomsContainer>
        )
    }

    if (error) {
        return (
            <LiveChatRoomsContainer>
                <div>error</div>
            </LiveChatRoomsContainer>
        )
    }

    return (
        <LiveChatRoomsContainer>
            <List channels={channels} />

        </LiveChatRoomsContainer>
    )
}
