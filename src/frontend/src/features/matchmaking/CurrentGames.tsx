import { useLobbyRoom } from "@colyseus/react";
import { Client } from "@colyseus/sdk";
import { JSX } from "react";

const client = new Client(import.meta.env.VITE_GAME_URL ?? 'ws://localhost:2567');

export function CurrentGames(): JSX.Element {
    const { rooms, error, isConnecting } = useLobbyRoom(
        () => client.joinOrCreate('lobby'),
    );

    if (isConnecting) return <p>Connecting...</p>;
    if (error) return <p>Error: {error.message}</p>;

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
