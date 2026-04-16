import { createContext, ReactNode, useContext, useState } from 'react';
import { Client, Room } from '@colyseus/sdk';
import { useAuth } from './Auth';
import { closeCodes } from '../../shared/types/close-codes';

export interface RoomContextType {
    isConnecting: boolean;
    isConnected: boolean;
    isReconnecting: boolean;
    room: Room;
    join: (roomId: string) => void;
    error: number;
}

export const RoomContext = createContext<RoomContextType | null>(null);

export function useRoom() { return useContext(RoomContext); }

let room!: Room;

// INFO: workaround for React.StrictMode, to avoid multiple join requests
let hasActiveJoinRequest: boolean = false;
const client = new Client(import.meta.env.VITE_GAME_URL ?? 'http://localhost:2567');

export function RoomProvider({ children }: { children: ReactNode }) {
    const auth = useAuth();
    const [joinedGame, setJoinedGame] = useState<boolean>(false);
    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
    const [error, setError] = useState<number>(0);

    const join = async (roomId: string) => {
        if (hasActiveJoinRequest) { return; }
        if (isConnected) { return; }
        if (joinedGame) { return; }
        hasActiveJoinRequest = true;

        setIsConnecting(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 1000)); // INFO: wait for proper game-server initialization
            room = await client
                .joinById(roomId, { userId: Number(auth.userId) });
            setJoinedGame(true);
            console.log('Connected to roomId: ' + room.roomId);
        } catch (e) {
            setError(closeCodes.FAILED_TO_JOIN);
            setIsConnecting(false);
            return;

        } finally {
            hasActiveJoinRequest = false;
        }

        // INFO: cache reconnection token, if user goes back to this URL, we can try re-connect to the room.
        localStorage.setItem("reconnection", JSON.stringify({
            token: room.reconnectionToken,
            roomId: room.roomId,
        }));


        room.onLeave((code, reason) => {
            console.log(`Left room. Code: ${code}, Reason: ${reason}`);
            setIsConnected(false);

            if (code === closeCodes.FAILED_TO_RECONNECT) {
                setError(code);
            } else if (code === closeCodes.FAILED_TO_FINISH) {
                setError(code);
            }
        });

        room.onDrop((code, reason) => {
            console.log(`Connection dropped! Code: ${code}, Reason: ${reason}`);
            setIsConnected(false);
            setIsReconnecting(true);
        })

        room.onReconnect(() => {
            console.log("Reconnected!");
            setIsConnected(true);
            setIsReconnecting(false);
        });

        room.reconnection.maxRetries = 5; //            Maximum reconnection attempts (default: 15)
        room.reconnection.delay = 1000; //              Initial delay in ms (default: 100)
        room.reconnection.minDelay = 1000; //           Minimum delay in ms (default: 100)
        room.reconnection.maxDelay = 1000; //           Maximum delay in ms (default: 5000)
        room.reconnection.minUptime = 0; //             Minimum uptime before auto-reconnect (default: 5000)
        room.reconnection.maxEnqueuedMessages = 10; //  Max buffered messages (default: 10)

        setIsConnected(true);
    };

    return (
        <RoomContext.Provider value={{ isConnecting, isConnected, isReconnecting, room, join, error }}>
            {children}
        </RoomContext.Provider>
    );
}
