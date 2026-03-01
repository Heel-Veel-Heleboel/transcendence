import { JSX } from "react"
import { GamesAvailable } from "../utils/MenuUtils"

import { Client } from "@colyseus/sdk";
import { useLobbyRoom } from "@colyseus/react";

const client = new Client("ws://localhost:2567");

function Lobby() {
    const { rooms, error, isConnecting } = useLobbyRoom(
        () => client.joinOrCreate("lobby"),
    );

    if (isConnecting) return <p>Connecting...</p>;
    if (error) return <p>Error: {error.message}</p>;
    console.log(rooms);

    return (
        <ul>
            {rooms.map((room) => (
                <li key={room.roomId}>
                    {room.name} — {room.clients}/{room.maxClients} players
                </li>
            ))}
        </ul>
    );
}

/* v8 ignore start */
export function Gymkhana(): JSX.Element {
    const quickPlayContent = (): JSX.Element => {
        return (
            Lobby()
        )
    }
    const defaultContent = (): JSX.Element => {
        return (
            <div>content</div>
        )
    }
    const customizedContent = (): JSX.Element => {
        return (
            <div>content</div>
        )
    }
    return (
        <GamesAvailable quickPlayContent={quickPlayContent()} defaultContent={defaultContent()} customizedContent={customizedContent()} />
    )
}
/* v8 ignore stop */
