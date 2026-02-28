import React, { createContext, useContext } from 'react';
import { Client, Room } from '@colyseus/sdk';

export interface RoomContextType {
    isConnecting: boolean;
    isConnected: boolean;
    room: Room;
    join: () => void;
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

export function RoomProvider({ children }: { children: React.ReactNode }) {

    const [joinError, setJoinError] = React.useState(false);
    const [isConnecting, setIsConnecting] = React.useState(false);
    const [isConnected, setIsConnected] = React.useState(false);

    const join = async () => {
        if (hasActiveJoinRequest) { return; }
        if (isConnected) { return; }
        hasActiveJoinRequest = true;

        setIsConnecting(true);

        try {
            room = await client
                .joinOrCreate('game_room')
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

        setIsConnected(true);
    };

    return (
        <RoomContext.Provider value={{ isConnecting, isConnected, room, join, joinError }}>
            {children}
        </RoomContext.Provider>
    );
}
