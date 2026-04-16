import { createContext, ReactNode, useContext, useState } from 'react';
import { Client, Room } from '@colyseus/sdk';
import { useAuth } from './Auth';

export interface RoomContextType {
    isConnecting: boolean;
    isConnected: boolean;
    isDropped: boolean;
    room: Room;
    join: (roomId: string) => void;
    joinError: boolean;
    reconnectionFailure: boolean;
}

export const RoomContext = createContext<RoomContextType | null>(null);

export function useRoom() { return useContext(RoomContext); }

let room!: Room;

//
// Workaround for React.StrictMode, to avoid multiple join requests
//
let hasActiveJoinRequest: boolean = false;
const client = new Client(import.meta.env.VITE_GAME_URL ?? 'http://localhost:2567');

export function RoomProvider({ children }: { children: ReactNode }) {
    const auth = useAuth();
    const [joinError, setJoinError] = useState<boolean>(false);
    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isDropped, setIsDropped] = useState<boolean>(false);
    const [reconnectionFailure, setReconnectionFailure] = useState<boolean>(false);

    const join = async (roomId: string) => {
        if (hasActiveJoinRequest) { return; }
        if (isConnected) { return; }
        hasActiveJoinRequest = true;

        setIsConnecting(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            room = await client
                .joinById(roomId, { userId: Number(auth.userId) });
            console.log('Connected to roomId: ' + room.roomId);
        } catch (e) {
            setJoinError(true);
            setIsConnecting(false);
            return;

        } finally {
            hasActiveJoinRequest = false;
        }

        //
        // cache reconnection token, if user goes back to this URL, we can try re-connect to the room.
        // TODO: do not cache reconnection token if user is spectating
        //
        localStorage.setItem("reconnection", JSON.stringify({
            token: room.reconnectionToken,
            roomId: room.roomId,
        }));


        room.onLeave((code, reason) => {
            console.log(`Left room. Code: ${code}, Reason: ${reason}`);
            if (code === 4003) {
                setReconnectionFailure(true);
            }

            // if (code === CloseCode.FAILED_TO_RECONNECT) {
            //     // Reconnection failed after all retries
            //     showConnectionFailedScreen();
            // } else {
            //     // Normal leave
            //     returnToLobby();
            // }
            setIsConnected(false);
        });

        room.onDrop((code, reason) => {
            console.log(`Connection dropped! Code: ${code}, Reason: ${reason}`);
            setIsDropped(true)
        })

        room.onReconnect(() => {
            console.log("Reconnected!");
        });

        room.reconnection.maxRetries = 5;        // Maximum reconnection attempts (default: 15)
        room.reconnection.delay = 1000;            // Initial delay in ms (default: 100)
        room.reconnection.minDelay = 1000;         // Minimum delay in ms (default: 100)
        room.reconnection.maxDelay = 1000;        // Maximum delay in ms (default: 5000)
        room.reconnection.minUptime = 0;       // Minimum uptime before auto-reconnect (default: 5000)
        room.reconnection.maxEnqueuedMessages = 10; // Max buffered messages (default: 10)

        setIsConnected(true);
    };

    return (
        <RoomContext.Provider value={{ isConnecting, isConnected, isDropped, room, join, joinError, reconnectionFailure }}>
            {children}
        </RoomContext.Provider>
    );
}
