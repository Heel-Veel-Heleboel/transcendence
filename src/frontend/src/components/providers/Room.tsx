import { createContext, ReactNode, useContext, useState } from 'react';
import { Client, Room } from '@colyseus/sdk';

export interface RoomContextType {
    isConnecting: boolean;
    isConnected: boolean;
    isDropped: boolean;
    room: Room;
    join: (roomId: string) => void;
    joinError: boolean;
}

export const RoomContext = createContext<RoomContextType | null>(null);

export function useRoom() { return useContext(RoomContext); }

let room!: Room;

//
// Workaround for React.StrictMode, to avoid multiple join requests
//
let hasActiveJoinRequest: boolean = false;
const client = new Client("http://localhost:2567");

export function RoomProvider({ children }: { children: ReactNode }) {
    const [joinError, setJoinError] = useState<boolean>(false);
    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isDropped, setIsDropped] = useState<boolean>(false);

    const join = async (roomId: string) => {
        if (hasActiveJoinRequest) { return; }
        if (isConnected) { return; }
        hasActiveJoinRequest = true;

        setIsConnecting(true);

        try {
            room = await client
                .joinById(roomId);
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


        room.onLeave(() => setIsConnected(false));
        room.onDrop(() => {
            setIsDropped(true)
            console.log('dropped')
        })

        setIsConnected(true);
    };

    return (
        <RoomContext.Provider value={{ isConnecting, isConnected, isDropped, room, join, joinError }}>
            {children}
        </RoomContext.Provider>
    );
}
