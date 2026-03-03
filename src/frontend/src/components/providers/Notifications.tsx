import { createContext, ReactNode, useContext, useEffect } from 'react';
import useWebSocket, { ReadyState, SendMessage } from 'react-use-websocket';
import { CONFIG } from '../../constants/AppConfig';
import { useAuth } from './Auth';

type NotificationContextType = {
    sendMessage: SendMessage;
    lastMessage: MessageEvent<any> | null;
    readyState: ReadyState;

}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const auth = useAuth();

    // const socket = new WebSocket('ws://localhost:3000/ws'
    // );
    //
    // socket.onopen = () => {
    //     console.log('socket connected');
    // }

    const {
        sendMessage,
        sendJsonMessage,
        lastMessage,
        lastJsonMessage,
        readyState,
        getWebSocket,
    } = useWebSocket(CONFIG.NOTIFICATION_URI,
        {
            share: true,
            shouldReconnect: (_closeEvent) => true,
            onOpen: () => { sendMessage(JSON.stringify({ type: 'AUTH', token: (auth.token) })) },
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
    console.log(readyState);
    console.log('here');

    return (
        <NotificationContext.Provider value={{ sendMessage, lastMessage, readyState }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    return useContext(NotificationContext);
};

