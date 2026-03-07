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
    return (

        <div id={CONFIG.MATCHMAKING_CONTAINER_ID} className="flex flex-col justify-items-stretch min-h-full">
            <div className="flex w-full min-h-1/3 border border-black">
                <div className="min-h-full w-1/2">
                    <JoinSingleGames />
                </div>
                <div className="min-h-full w-1/2">
                    <JoinTournamentGames />
                </div>
            </div>
            <div className="w-full min-h-1/2">
                <LobbyRoom title="something" gamesContent={Lobby()} />
            </div>
        </div>
    );
}

export function JoinTournamentGames(): JSX.Element {
    const [joiningDefault, SetJoiningDefault] = useState<boolean>(false);
    const [joiningCustomized, SetJoiningCustomized] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    async function handleDefault() {
        if (!joiningDefault) {
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
        } else {
            try {
                await api({
                    url: CONFIG.REQUEST_MATCHMAKING_CLASSIC_CANCEL,

                    method: CONFIG.REQUEST_MATCHMAKING_METHOD
                });
            } catch (e: any) {
                console.error(e);
                setError(ERRORS.MATCHMAKING_LEAVE_FAILED);
                return;
            }
        }
        SetJoiningDefault(!joiningDefault);
    }
    async function handleCustomized() {
        if (!joiningCustomized) {
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
        } else {
            try {
                await api({
                    url: CONFIG.REQUEST_MATCHMAKING_POWERUP_CANCEL,

                    method: CONFIG.REQUEST_MATCHMAKING_METHOD
                });
            } catch (e: any) {
                console.error(e);
                setError(ERRORS.MATCHMAKING_LEAVE_FAILED);
                return;

            }
            SetJoiningCustomized(!joiningCustomized);
        }
    }


    return (
        // <div className="min-h-full w-full min-h-full" id="TournamentJoinGames">
        //     {error ? <MatchMakingError setState={setError} /> :
        <div className="min-h-full flex w-full grow">
            <div className="flex w-1/2 justify-between border border-black">
                <div />
                <button onClick={handleDefault}>{joiningDefault ? CONFIG.CANCEL_JOIN_BUTTON : CONFIG.TOURNAMENT_CLASSIC_GAME}</button>
                <div />
            </div>
            <div className="flex w-1/2 justify-between border border-black">
                <div />
                <button onClick={handleCustomized}>{joiningCustomized ? CONFIG.CANCEL_JOIN_BUTTON : CONFIG.TOURNAMENT_POWERUP_GAME}</button>
                <div />
            </div>
        </div>
        //     }
        // </div>
    )
}

export function JoinSingleGames(): JSX.Element {
    const [joiningDefault, SetJoiningDefault] = useState<boolean>(false);
    const [joiningCustomized, SetJoiningCustomized] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    async function handleDefault() {
        if (!joiningDefault) {
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
        } else {
            try {
                await api({
                    url: CONFIG.REQUEST_MATCHMAKING_CLASSIC_CANCEL,

                    method: CONFIG.REQUEST_MATCHMAKING_METHOD
                });
            } catch (e: any) {
                console.error(e);
                setError(ERRORS.MATCHMAKING_LEAVE_FAILED);
                return;
            }
        }
        SetJoiningDefault(!joiningDefault);
    }
    async function handleCustomized() {
        if (!joiningCustomized) {
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
        } else {
            try {
                await api({
                    url: CONFIG.REQUEST_MATCHMAKING_POWERUP_CANCEL,

                    method: CONFIG.REQUEST_MATCHMAKING_METHOD
                });
            } catch (e: any) {
                console.error(e);
                setError(ERRORS.MATCHMAKING_LEAVE_FAILED);
                return;

            }
            SetJoiningCustomized(!joiningCustomized);
        }
    }

    return (
        <div className="min-h-full w-full min-h-full" id="SingleJoinGames">
            {error ? <MatchMakingError setState={setError} /> :
                <div className="flex w-full">
                    <div className="flex w-1/2 justify-between border border-black">
                        <div />
                        <button onClick={handleDefault}>{joiningDefault ? CONFIG.CANCEL_JOIN_BUTTON : CONFIG.SINGLE_CLASSIC_GAME}</button>
                        <div />
                    </div>
                    <div className="flex w-1/2 justify-between border border-black">
                        <div />
                        <button onClick={handleCustomized}>{joiningCustomized ? CONFIG.CANCEL_JOIN_BUTTON : CONFIG.SINGLE_POWERUP_GAME}</button>
                        <div />
                    </div>
                </div>
            }
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
