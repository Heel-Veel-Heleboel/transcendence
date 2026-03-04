import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import useWebSocket, { ReadyState, SendMessage } from 'react-use-websocket';
import { CONFIG } from '../../constants/AppConfig';
import { useAuth } from './Auth';
import { SendJsonMessage, WebSocketLike, WebSocketMessage } from 'react-use-websocket/dist/lib/types';

type NotificationContextType = {
    sendMessage: SendMessage | null;
    lastMessage: MessageEvent<any> | null;
    readyState: ReadyState | null;

}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [getSendMessage, setSendmessage] = useState<SendMessage | null>(null);
    const [getSendJsonMessage, setSendJsonMessage] = useState<SendJsonMessage | null>(null);
    const [getLastMessage, setLastMessage] = useState<MessageEvent<any> | null>(null);
    const [getLastJsonMessage, setLastJsonMessage] = useState<unknown | null>(null);
    const [getReadyState, setReadyState] = useState<ReadyState | null>(null);
    const [getGetWebSocket, setGetWebSocket] = useState<() => (WebSocketLike | null)>(() => null);
    const auth = useAuth();

    function join() {
        const {
            sendMessage,
            sendJsonMessage,
            lastMessage,
            lastJsonMessage,
            readyState,
            getWebSocket,
        } =
            useWebSocket(CONFIG.NOTIFICATION_URI,
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
        setSendmessage(sendMessage);
        setSendJsonMessage(sendJsonMessage);
        setLastMessage(lastMessage);
        setLastJsonMessage(lastJsonMessage);
        setGetWebSocket(getWebSocket);
        setReadyState(readyState);
        console.log(readyState);
        console.log('here');
    }

    return (
        <NotificationContext.Provider value={{ sendMessage: getSendMessage, lastMessage: getLastMessage, readyState: getReadyState }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    return useContext(NotificationContext);
};

