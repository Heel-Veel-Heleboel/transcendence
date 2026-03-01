import { JSX, useState } from "react"
import { LobbyRoom } from "../utils/MenuUtils"

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
                    {room.name} — {room.clients}/{room.maxClients} players | {room.roomId} roomId
                </li>
            ))}
        </ul>
    );
}

/* v8 ignore start */
export function Gymkhana(): JSX.Element {
    const [joiningDefault, SetJoiningDefault] = useState<boolean>(false);
    const [joiningCustomized, SetJoiningCustomized] = useState<boolean>(false);
    const cancelText = 'cancel';

    function handleDefault() {
        SetJoiningDefault(!joiningDefault);
    }
    function handleCustomized() {
        SetJoiningCustomized(!joiningCustomized);
    }

    return (
        <div id='gymKhanaContainer' className="flex justify-items-stretch min-h-full">
            <div className="w-1/5 flex flex-col border border-black">
                <button onClick={handleDefault}>{joiningDefault ? cancelText : 'default'}</button>
                <button onClick={handleCustomized}>{joiningCustomized ? cancelText : 'customized'}</button>
            </div>
            <div className="w-4/5">
                <LobbyRoom gamesContent={Lobby()} />
            </div>
        </div>
    )
}
/* v8 ignore stop */
