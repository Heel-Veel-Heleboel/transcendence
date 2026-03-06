import useWebSocket from "react-use-websocket";
import { CONFIG } from "../../constants/AppConfig";
import { useAuth } from "../providers/Auth";
import { useNavigate } from "react-router-dom";

export function useNotifications() {
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

                    if (msg.type === 'MATCH_READY') {
                        navigate(`/game/${msg.gameMode}/${msg.matchId}/${msg.roomId}`)
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
    console.log(notif.readyState);
    console.log('here');
    return notif
}
