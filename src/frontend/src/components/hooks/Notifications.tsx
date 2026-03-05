import useWebSocket from "react-use-websocket";
import { CONFIG } from "../../constants/AppConfig";
import { useAuth } from "../providers/Auth";

export function useNotifications() {
    const auth = useAuth();
    const notif =
        useWebSocket(CONFIG.NOTIFICATION_URI,
            {
                share: true,
                shouldReconnect: (_closeEvent) => true,
                onOpen: () => { notif.sendMessage(JSON.stringify({ type: 'AUTH', token: (auth.token) })) },
                onMessage: (event) => {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'AUTH_OK') {
                        console.log('auth_ok');
                    } else {
                        console.log('auth_not')
                    }
                    console.log(event);
                    console.log(msg);
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
