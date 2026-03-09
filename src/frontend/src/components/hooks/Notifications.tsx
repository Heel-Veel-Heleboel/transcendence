import useWebSocket from "react-use-websocket";
import { CONFIG } from "../../constants/AppConfig";
import { useAuth } from "../providers/Auth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export function useNotifications() {
    const [chatUpdate, setChatUpdate] = useState<string>('');
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
                    if (msg.type === 'chat:match_ack_required') {
                        setChatUpdate(msg.messageId);
                    }
                    // handle chat:message, chat:match_ack_required, etc.
                },
                onClose: (event) => {
                    // optionally reconnect if not intentional close
                    if (event.code !== 1000) {
                        // schedule reconnect
                    }
                }
            });
    return { ws: notif, chatUpdate: chatUpdate }
}
