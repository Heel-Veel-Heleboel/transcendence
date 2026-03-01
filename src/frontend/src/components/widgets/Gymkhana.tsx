import { Dispatch, JSX, SetStateAction, useState } from "react"
import { LobbyRoom } from "../utils/MenuUtils"

import { Client } from "@colyseus/sdk";
import { useLobbyRoom } from "@colyseus/react";
import api from "../../api";
import { CONFIG } from "../../constants/AppConfig";
import { ERRORS } from "../../constants/Errors";

const client = new Client("ws://localhost:2567");


/* v8 ignore start */
export function Gymkhana(): JSX.Element {
    const [joiningDefault, SetJoiningDefault] = useState<boolean>(false);
    const [joiningCustomized, SetJoiningCustomized] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    async function handleDefault() {
        try {
            await api({
                url: CONFIG.REQUEST_MATCHMAKING_CLASSIC,

                method: CONFIG.REQUEST_MATCHMAKING_METHOD
            });
        } catch (e: any) {
            console.error(e);
            setError(ERRORS.MATCHMAKING_CLASSIC_FAILED);
            return;
        }
        SetJoiningDefault(!joiningDefault);
    }
    async function handleCustomized() {
        try {
            await api({
                url: CONFIG.REQUEST_MATCHMAKING_POWERUP,
                method: CONFIG.REQUEST_MATCHMAKING_METHOD
            });
        } catch (e: any) {
            console.error(e);
            setError(ERRORS.MATCHMAKING_POWERUP_FAILED);
            return;
        }
        SetJoiningCustomized(!joiningCustomized);
    }

    return (
        <div id={CONFIG.MATCHMAKING_CONTAINER_ID} className="flex justify-items-stretch min-h-full">
            <div className="w-1/5 flex flex-col border border-black">
                {error ? <MatchMakingError setState={setError} /> :
                    <div className="flex flex-col">
                        <button onClick={handleDefault}>{joiningDefault ? CONFIG.CANCEL_JOIN_BUTTON : CONFIG.CLASSIC_GAME}</button>
                        <button onClick={handleCustomized}>{joiningCustomized ? CONFIG.CANCEL_JOIN_BUTTON : CONFIG.POWERUP_GAME}</button>
                    </div>
                }
            </div>
            <div className="w-4/5">
                <LobbyRoom gamesContent={Lobby()} />
            </div>
        </div>
    )
}

function MatchMakingError({ setState }: { setState: Dispatch<SetStateAction<string | null>> }): JSX.Element {

    return (
        <div>
            <div>{ERRORS.MATCHMAKING_JOIN_FAILED}</div>
            <button onClick={() => setState(null)}> reset</button>
        </div>
    )
}


function Lobby(): JSX.Element {
    const { rooms, error, isConnecting } = useLobbyRoom(
        () => client.joinOrCreate(CONFIG.LOBBYROOM),
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
/* v8 ignore stop */
