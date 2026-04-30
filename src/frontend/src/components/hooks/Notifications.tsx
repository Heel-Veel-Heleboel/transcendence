import useWebSocket from "react-use-websocket";
import { useAuth } from "../providers/Auth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { CONFIG } from "../../shared/config/AppConfig";

export function useNotifications() {
    const [chatUpdate, setChatUpdate] = useState<number>(0);
    const [messageUpdate, setMessageUpdate] = useState<number>(0);
    const [matchUpdate, setMatchUpdate] = useState<number>(0);
    const [tournamentUpdate, setTournamentUpdate] = useState<number>(0);
    const [friendshipUpdate, setFriendshipUpdate] = useState<number>(0);
    const [lastMessageChannelId, setLastMessageChannelId] = useState<string | null>(null);
    const auth = useAuth();
    const navigate = useNavigate();
    const notif =
        useWebSocket(CONFIG.NOTIFICATION_URI,
            {
                shouldReconnect: (_closeEvent) => true,
                onOpen: () => { notif.sendMessage(JSON.stringify({ type: 'AUTH', token: (auth.token) })) },
                onMessage: (event) => {
                    const msg = JSON.parse(event.data);
                    console.log(msg);
                    console.log('lastMessage')
                    console.log(notif.lastMessage);

                    if (msg.type === 'MATCH_READY') {
                        navigate(`/game/${msg.gameMode}/${msg.matchId}/${msg.roomId}`)
                    }
                    if (msg.type === 'MATCH_JOINED_POOL' || msg.type === 'MATCH_LEAVED_POOL' || msg.type === 'MATCH_FINISHED') {
                        setMatchUpdate(event.timeStamp)
                    }
                    if (msg.type === 'chat:channel_created') {
                        setChatUpdate(event.timeStamp);
                    }
                    if (msg.type === 'chat:match_ack_required') {
                        setMatchUpdate(event.timeStamp)
                        setChatUpdate(event.timeStamp);
                        setMessageUpdate(event.timeStamp);
                    }
                    if (msg.type === 'chat:match_ack_response') {
                        setMatchUpdate(event.timeStamp)
                    }
                    if (msg.type === 'TOURNAMENT_UPDATE') {
                        setTournamentUpdate(event.timeStamp);
                    }
                    if (msg.type === 'FRIENDSHIP_REQUEST') {
                        setFriendshipUpdate(event.timeStamp);
                    }
                    if (msg.type === 'chat:message') {
                        setMessageUpdate(event.timeStamp);
                        setLastMessageChannelId(msg.channelId ?? null);
                    }
                },
                onClose: (event) => {
                    // optionally reconnect if not intentional close
                    if (event.code !== 1000) {
                        // schedule reconnect
                    }
                }
            });
    return { ws: notif, chatUpdate, messageUpdate, tournamentUpdate, matchUpdate, friendshipUpdate, lastMessageChannelId }
}
