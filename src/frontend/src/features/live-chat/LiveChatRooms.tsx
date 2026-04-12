import { Dispatch, JSX, useState, SetStateAction, useEffect } from "react";
import { useChatService } from "../../components/providers/Chat";
import { useNotifications } from "../../components/hooks/Notifications";
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
export function LiveChatRooms({ setChat }: { setChat: Dispatch<SetStateAction<string | null>> }): JSX.Element {
    const service = useChatService();
    const notif = useNotifications();
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
    }, [notif.chatUpdate]);

    function List({ channels }: { channels: Array<IChat> }) {
        // TODO: make seperate unread counter component
        const listItems = channels.map(item =>
            <li onClick={() => { setChat(item.id) }} key={0}>{item.id} {item.unreadCount ? `unread:${item.unreadCount}` : null}</li>
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
